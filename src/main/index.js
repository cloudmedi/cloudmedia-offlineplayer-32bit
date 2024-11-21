const { app, shell, BrowserWindow, ipcMain, dialog,globalShortcut } = require('electron');
const { join } = require('path');
const { electronApp, optimizer, is } = require('@electron-toolkit/utils');

const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const Store = require('electron-store');
const axios = require('axios');
const { autoUpdater } = require("electron-updater");
const store = new Store();
const AutoLaunch = require('auto-launch');
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

app.commandLine.appendSwitch('NSApplicationSupportsSecureRestorableState');

let mainWindow;
let syncInterval;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 670,
    minWidth: 960,
    minHeight: 670,
    maxWidth: 960,
    maxHeight: 670,
    resizable: false,
    show: false,
    autoHideMenuBar: true,
    icon: join(__dirname, '../../src/renderer/src/assets/icon.ico'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  globalShortcut.register('Control+I', () => {
    mainWindow.webContents.openDevTools();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}


app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.setLoginItemSettings({
    openAtLogin: true
  });

  autoUpdater.checkForUpdates();

  autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update-message-reply', 'Güncelleme mevcut.');
  });

  autoUpdater.on('update-not-available', () => {
    mainWindow.webContents.send('update-message-reply', 'Güncelleme mevcut değil.');
  });

  autoUpdater.on("download-progress", () => {
    mainWindow.webContents.send('update-message-reply', 'Güncelleme indiriliyor.');
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update-message-reply', 'Güncelleme indirildi. Uygulama yeniden başlatılıyor...');
    autoUpdater.quitAndInstall();
  });

  autoUpdater.on('error', (error) => {
    mainWindow.webContents.send('update-message-reply', `Güncelleme sırasında bir hata oluştu: ${error.message}`);
  });

  ipcMain.on("start-update", () => {
    autoUpdater.downloadUpdate();
  });
  
  startPlaylistAndCampaignSync();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on("login-info", (event, data) => {
  if (data) {
    store.set("userinfo", data);
  }
});

ipcMain.on("log-out", (event, data) => {
  if (data === "log-out") {
    store.clear("userinfo");
  }
});

ipcMain.on("get-user", async (event) => {
  const user = store.get("userinfo");
  if (user) {
    try {
      const allPlaylists = await getAllSongsInPlaylists(user);
      const campaigns = await getCampaigns(user);
      event.reply("get-user-reply", { allPlaylists, campaigns, user });
    } catch (error) {
      console.error("Error fetching data:", error);
      const offlinePlaylists = await getOfflinePlaylists();
      const offlineCampaigns = await getOfflineCampaigns();
      event.reply("get-user-reply", { allPlaylists: offlinePlaylists, campaigns: offlineCampaigns, user, isOffline: true });
    }
  }
});

async function getAllSongsInPlaylists(user) {
  try {
    const response = await axios.get(`https://app.cloudmedia.com.tr/api/playlista/${String(user?.user?.id)}`);
    if (response.data) {
      const playlists = response.data.Playlist;
      const allPlaylists = [];

      for (const playlist of playlists) {
        const playlistResponse = await axios.get(`https://app.cloudmedia.com.tr/api/getsong/${playlist.id}`);
        if (playlistResponse.data && playlistResponse.data.song) {
          const songs = playlistResponse.data.song;
          const downloadedSongs = await downloadSongs(songs, playlist.title);

          const playlistWithSongs = {
            playlistId: playlist.id,
            playlistName: playlist.title,
            playlistImage: playlist.artwork_url,
            songs: downloadedSongs
          };
          allPlaylists.push(playlistWithSongs);
        }
      }

      await savePlaylistsLocally(allPlaylists);

      return allPlaylists;
    }
  } catch (error) {
    console.error("Error occurred:", error);
    return await getOfflinePlaylists();
  }
}

async function downloadSongs(songs, playlistName) {
  if (!songs || songs.length === 0) {
    console.log(`No songs to download for playlist: ${playlistName}`);
    return [];
  }

  const totalSongs = songs.length;
  let completedSongs = 0;
  let actualDownloads = false; // Gerçek indirme kontrolü için bayrak

  const downloadedSongs = [];
  for (const song of songs) {
    try {
      const downloadResult = await downloadSong(song, playlistName);
      
      // Sadece yeni indirilen şarkılar için işlem yap
      if (downloadResult.isNewDownload) {
        actualDownloads = true;
        downloadedSongs.push({ ...song, localPath: downloadResult.path, playlistName });

        completedSongs++;
        const totalProgress = Math.round((completedSongs / totalSongs) * 100);
        mainWindow.webContents.send('download-progress', { 
          playlistName, 
          totalProgress, 
          actualDownloads: true 
        });
      } else {
        // Zaten var olan şarkılar için
        downloadedSongs.push({ ...song, localPath: downloadResult.path, playlistName });
      }

    } catch (error) {
      console.error(`Error occurred while downloading song ${song.title}:`, error);
    }
  }

  // Yeni indirilen şarkılar varsa tamamlanma mesajı gönder
  if (actualDownloads) {
    mainWindow.webContents.send('download-completed', { 
      playlistName, 
      totalProgress: 100,
      actualDownloads: true 
    });
  }

  return downloadedSongs;
}

async function downloadSong(song, playlistName) {
  const songUrl = song.playlink;
  const fileName = `${song.title}.mp3`;
  const downloadPath = path.join(app.getPath('music'), 'CloudMedia', playlistName, fileName);

  try {
    // Dosya zaten varsa
    await fsPromises.access(downloadPath);
    console.log(`Song already exists: ${downloadPath}`);
    return { 
      path: downloadPath, 
      isNewDownload: false 
    };
  } catch (error) {
    // Dosya yoksa indirme işlemine devam et
  }

  await fsPromises.mkdir(path.dirname(downloadPath), { recursive: true });

  const response = await axios({
    url: songUrl,
    method: 'GET',
    responseType: 'stream'
  });

  const writer = fs.createWriteStream(downloadPath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve({ 
      path: downloadPath, 
      isNewDownload: true 
    }));
    writer.on('error', reject);
  });
}

async function savePlaylistsLocally(playlists) {
  const playlistsPath = path.join(app.getPath('userData'), 'playlists.json');
  await fsPromises.writeFile(playlistsPath, JSON.stringify(playlists), 'utf-8');
}

async function getOfflinePlaylists() {
  const playlistsPath = path.join(app.getPath('userData'), 'playlists.json');
  try {
    const data = await fsPromises.readFile(playlistsPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading offline playlists:", error);
    return [];
  }
}

async function getCampaigns(user) {
  const camApi = "https://app.cloudmedia.com.tr/api/comapi/";
  const userId = user?.user?.id;
  try {
    const response = await axios.get(`${camApi}${userId}`);
    const campaigns = response.data;
    const groupedCampaigns = {
      type0: [],
      type1: [],
      type2: []
    };

    if (campaigns && campaigns.data !== null) {
      campaigns?.forEach(campaign => {
        groupedCampaigns['type' + campaign.CompanyType].push(campaign);
      });
    }

    await downloadCampaigns(groupedCampaigns);
    await saveCampaignsLocally(groupedCampaigns);
console.log(groupedCampaigns)
    return groupedCampaigns;
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return await getOfflineCampaigns();
  }
}

async function downloadCampaigns(groupedCampaigns) {
  for (const type in groupedCampaigns) {
    for (const campaign of groupedCampaigns[type]) {
      try {
        const downloadedPath = await downloadCampaignFile(campaign);
        campaign.localPath = downloadedPath;
      } catch (error) {
        console.error(`Error occurred while downloading campaign ${campaign.id}:`, error);
      }
    }
  }
}

async function downloadCampaignFile(campaign) {
  const fileUrl = campaign.path;
  const fileName = `campaign_${campaign.id}${path.extname(fileUrl)}`;
  const downloadPath = path.join(app.getPath('userData'), 'Campaigns', fileName);

  try {
    await fsPromises.access(downloadPath);
    console.log(`Campaign file already exists: ${downloadPath}`);
    return downloadPath;
  } catch (error) {
    // File doesn't exist, proceed with download
  }

  await fsPromises.mkdir(path.dirname(downloadPath), { recursive: true });

  const response = await axios({
    url: fileUrl,
    method: 'GET',
    responseType: 'stream'
  });

  const writer = fs.createWriteStream(downloadPath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(downloadPath));
    writer.on('error', reject);
  });
}

async function saveCampaignsLocally(campaigns) {
  const campaignsPath = path.join(app.getPath('userData'), 'campaigns.json');
  await fsPromises.writeFile(campaignsPath, JSON.stringify(campaigns), 'utf-8');
}

async function getOfflineCampaigns() {
  const campaignsPath = path.join(app.getPath('userData'), 'campaigns.json');
  try {
    const data = await fsPromises.readFile(campaignsPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading offline campaigns:", error);
    return { type0: [], type1: [], type2: [] };
  }
}

async function startPlaylistAndCampaignSync() {
  const user = store.get("userinfo");
  if (!user) {
    console.log("No user logged in. Skipping sync.");
    return;
  }

  let previousPlaylists = await getOfflinePlaylists();
  let previousCampaigns = await getOfflineCampaigns();

  syncInterval = setInterval(async () => {
    console.log("Checking for updates...");
    try {
      const newPlaylists = await getAllSongsInPlaylists(user);
      const newCampaigns = await getCampaigns(user);

      let playlistsChanged = false;
      let campaignsChanged = false;

      // Check for playlist changes
      if (JSON.stringify(newPlaylists) !== JSON.stringify(previousPlaylists)) {
        playlistsChanged = true;
        
        // Delete local playlists that no longer exist for the user
        for (const oldPlaylist of previousPlaylists) {
          if (!newPlaylists.find(p => p.playlistId === oldPlaylist.playlistId)) {
            console.log(`Playlist deleted: ${oldPlaylist.playlistName}`);
            await deletePlaylist(oldPlaylist);
          }
        }

        // Download or update new playlists
        for (const newPlaylist of newPlaylists) {
          const oldPlaylist = previousPlaylists.find(p => p.playlistId === newPlaylist.playlistId);
          if (!oldPlaylist || JSON.stringify(oldPlaylist) !== JSON.stringify(newPlaylist)) {
            console.log(`New or updated playlist found: ${newPlaylist.playlistName}`);
            await downloadPlaylist(newPlaylist);
          }
        }

        // Delete local files for songs that are no longer in any playlist
        await deleteOrphanedSongs(newPlaylists);
      }

      // Check for campaign changes
      if (JSON.stringify(newCampaigns) !== JSON.stringify(previousCampaigns)) {
        campaignsChanged = true;
        for (const type in newCampaigns) {
          for (const newCampaign of newCampaigns[type]) {
            const oldCampaign = previousCampaigns[type]?.find(c => c.id === newCampaign.id);
            if (!oldCampaign || JSON.stringify(oldCampaign) !== JSON.stringify(newCampaign)) {
              console.log(`New or updated campaign found: ${newCampaign.id}`);
              await downloadCampaignFile(newCampaign);
            }
          }
        }

        for (const type in previousCampaigns) {
          for (const oldCampaign of previousCampaigns[type]) {
            if (!newCampaigns[type]?.find(c => c.id === oldCampaign.id)) {
              console.log(`Campaign deleted: ${oldCampaign.id}`);
              await deleteCampaignFile(oldCampaign);
            }
          }
        }
      }

      if (playlistsChanged || campaignsChanged) {
        await savePlaylistsLocally(newPlaylists);
        await saveCampaignsLocally(newCampaigns);
        
        // Notify frontend about the update
        mainWindow.webContents.send('data-updated', { 
          playlists: playlistsChanged ? newPlaylists :null, 
          campaigns: campaignsChanged ? newCampaigns :  newCampaigns 
        });

        console.log("Changes detected and sync completed.");
        
        // Update previous data for next comparison
        previousPlaylists = newPlaylists;
        previousCampaigns = newCampaigns;
      } else {
        console.log("No changes detected.");
      }
    } catch (error) {
      console.error("Error during sync:", error);
    }
  }, 12000); // Run every 12 seconds
}

async function deleteOrphanedSongs(currentPlaylists) {
  const cloudMediaPath = path.join(app.getPath('music'), 'CloudMedia');
  const allPlaylistFolders = await fsPromises.readdir(cloudMediaPath);

  for (const folder of allPlaylistFolders) {
    const folderPath = path.join(cloudMediaPath, folder);
    const stat = await fsPromises.stat(folderPath);

    if (stat.isDirectory()) {
      const playlist = currentPlaylists.find(p => p.playlistName === folder);
      
      if (!playlist) {
        // If the folder doesn't correspond to any current playlist, delete it
        await fsPromises.rm(folderPath, { recursive: true, force: true });
        console.log(`Deleted orphaned playlist folder: ${folder}`);
      } else {
        // If the playlist exists, check for orphaned songs within it
        const files = await fsPromises.readdir(folderPath);
        for (const file of files) {
          const filePath = path.join(folderPath, file);
          const songExists = playlist.songs.some(song => `${song.title}.mp3` === file);
          
          if (!songExists) {
            await fsPromises.unlink(filePath);
            console.log(`Deleted orphaned song: ${file} from playlist ${folder}`);
          }
        }
      }
    }
  }
}
async function downloadPlaylist(playlist) {
  console.log(`Downloading playlist: ${playlist.playlistName}`);
  const downloadPath = path.join(app.getPath('music'), 'CloudMedia', playlist.playlistName);
  
  await fsPromises.mkdir(downloadPath, { recursive: true });

  for (const song of playlist.songs) {
    await downloadSong(song, playlist.playlistName);
  }
}

async function deletePlaylist(playlist) {
  console.log(`Deleting playlist: ${playlist.playlistName}`);
  const playlistPath = path.join(app.getPath('music'), 'CloudMedia', playlist.playlistName);
  
  try {
    await fsPromises.rm(playlistPath, { recursive: true, force: true });
  } catch (error) {
    console.error(`Error deleting playlist ${playlist.playlistName}:`, error);
  }
}

async function deleteCampaignFile(campaign) {
  if (campaign.localPath) {
    try {
      await fsPromises.unlink(campaign.localPath);
      console.log(`Deleted campaign file: ${campaign.localPath}`);
    } catch (error) {
      console.error(`Error deleting campaign file ${campaign.localPath}:`, error);
    }
  }
}

// Stop sync when app is about to quit
app.on('will-quit', () => {
  if (syncInterval) {
    clearInterval(syncInterval);
  }
});