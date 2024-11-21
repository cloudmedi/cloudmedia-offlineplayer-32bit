import React, { useState, useEffect } from 'react';
import Home from './components/home/home';
import Playlist from './components/playist/playlist';
import ProgressBar from './components/progresBar'; // Progres çubuğu bileşeni
import axios from 'axios';

function App() {
  const [user, setUser] = useState(null);
  const [isLoggin, setIsLoggin] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null); // Toplam indirme progresi

  // Kullanıcı bilgisini çekme
  useEffect(() => {
    const getUser = async () => {
      window.electron.ipcRenderer.send('get-user');
      const data = await new Promise(resolve => {
        window.electron.ipcRenderer.once('get-user-reply', (_, data) => {
          resolve(data);
        });
      });
      setUser(data);
    };

    getUser();

    // Şarkıların ve kampanyaların güncellenmesini dinle
    const handleDataUpdate = (_, updatedData) => {
      setUser(prevUser => ({
        ...prevUser,
        allPlaylists: updatedData.playlists,
        campaigns: updatedData.campaigns
      }));
    };

    window.electron.ipcRenderer.on('data-updated', handleDataUpdate);

    return () => {
      window.electron.ipcRenderer.removeAllListeners('get-user-reply');
      window.electron.ipcRenderer.removeListener('data-updated', handleDataUpdate);
    };
  }, []);

  // Kullanıcı oturum durumu kontrolü
  useEffect(() => {
    if (user) {
      setIsLoggin(true);
      checkStatus();
    }
  }, [user]);

  // Kullanıcı durumu API'sine gönderim
  function checkStatus() {
    axios
      .post(`https://app.cloudmedia.com.tr/api/updateUserStatusApi/${user.id}/online`)
      .then(res => {
        console.log(res);
      });
  }

  // Güncelleme kontrolü
  useEffect(() => {
    window.electron.ipcRenderer.send("updateMessage");
    window.electron.ipcRenderer.once("update-message-reply", (_2, data) => {
      setUpdateMessage(data);
      if (data.includes('Güncelleme mevcut') || data.includes('Güncelleme indiriliyor.')) {
        setIsModalOpen(true);
      }
    });
    return () => {
      window.electron.ipcRenderer.removeAllListeners("update-message-reply");
    };
  }, [updateMessage]);

  // Güncelleme başlatma
  const handleUpdate = () => {
    window.electron.ipcRenderer.send('start-update');
    setIsModalOpen(false);
  };

  // İndirme progresini ve tamamlanma durumunu dinleme
  useEffect(() => {
    const handleDownloadProgress = (_, data) => {
      if (data.totalProgress === 0) return; // Eğer progres sıfırsa işlem yapma
      setDownloadProgress(data);
    };
  
    const handleDownloadCompleted = (_, data) => {
      console.log(`Download completed: ${data}`);
      setDownloadProgress(null);
    };
  
    window.electron.ipcRenderer.on('download-progress', handleDownloadProgress);
    window.electron.ipcRenderer.on('download-completed', handleDownloadCompleted);
  
    return () => {
      window.electron.ipcRenderer.removeListener('download-progress', handleDownloadProgress);
      window.electron.ipcRenderer.removeListener('download-completed', handleDownloadCompleted);
    };
  }, []);
  
console.log("------------------------",downloadProgress)
  return (
    <>
      {isLoggin ? <Playlist data={user} /> : <Home />}

      {/* Güncelleme Modalı */}
      {updateMessage && (
        <div className="modal1" style={{ display: isModalOpen ? 'block' : 'none' }}>
          <div className="modal-content1">
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <span
                style={{
                  fontFamily: "Arial",
                  fontSize: "20px",
                  fontWeight: "700",
                  lineHeight: "23px",
                  textAlign: "left",
                  color: "black"
                }}
              >
                {updateMessage}
              </span>
              <span className="close" onClick={() => setIsModalOpen(false)}>&times;</span>
            </div>

            {/* Güncelleme bilgisi */}
            {updateMessage === "Güncelleme mevcut." && (
              <p>Müzik uygulamamız için yeni bir güncelleme mevcut. En son özellikleri kullanmak için lütfen uygulamayı güncelleyin.</p>
            )}

            {/* Güncelleme butonu */}
            {updateMessage === "Güncelleme mevcut." && (
              <button className="btn-mes" onClick={handleUpdate}>Uygulamayı Güncelle</button>
            )}
          </div>
        </div>
      )}

      {/* İndirme Progres Modalı */}
      {downloadProgress && (
        <div className="modal1" style={{ display: 'block' }}>
          <div className="modal-content1">
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <span
                style={{
                  fontFamily: "Arial",
                  fontSize: "20px",
                  fontWeight: "700",
                  lineHeight: "23px",
                  textAlign: "left",
                  color: "black"
                }}
              >
                İndirme İşlemi
              </span>
              <span className="close" onClick={() => setDownloadProgress(null)}>&times;</span>
            </div>

            <p>Şarkılar indiriliyor...</p>
            <ProgressBar progress={downloadProgress?.totalProgress} />
          </div>
        </div>
      )}
    </>
  );
}

export default App;
