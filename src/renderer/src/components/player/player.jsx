import React, { useState, useEffect, useRef } from 'react';
import { PiPauseCircleLight, PiPlayCircleLight } from "react-icons/pi";
import _ from "lodash";
import './player.css';
import axios from 'axios';
import play from "./play.png";
import pause from "./pause.png";
import volume from "./volume.png";

const AudioPlayer = (props) => {

console.log(props)
  const [audioIndex, setAudioIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [campainPlaying, setCampainPlaying] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [savedPlaylists, setSavedPlaylists] = useState([]);
  const [clonePlaylist, setClonePlaylist] = useState([]);
  const [campainArray, setCampaignArray] = useState([]);
  const [campainArray1, setCampaignArray1] = useState([]);
  const [newArray, setNewArray] = useState([]);
  const previousType2Ref = useRef(null);

  const [campainClone, setCampainClone] = useState(props.data.campaigns?.type0);
  const [volumeLevel, setVolumeLevel] = useState(1);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [localCampaigns, setLocalCampaigns] = useState({});

  const audioRef1 = useRef(null);
  const audioRef2 = useRef(null);





  async function convertCampaignsToSongs(campaigns) {
   
    const songs = [];
    campaigns.sort((a, b) => a.CompanyValue - b.CompanyValue);
    
    for (let campaign of campaigns) {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const currentDay = days[new Date().getDay()];

      if (campaign[currentDay] === 1) {
  
        const newSong = {
          title: campaign.CompanyName || "",
          genre: "",
          mood: "",
          duration: 0,
          artwork_url: "",
          playlink:campaign.localPath,
          companyValue: campaign.CompanyValue
        };
        songs.push(newSong);
      }
    }

    setCampaignArray(songs);
  }

  async function convertCampaignsToSongs1(campaigns) {
    const songs = [];
    campaigns.sort((a, b) => a.CompanyValue - b.CompanyValue);
    
    for (let campaign of campaigns) {
   
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const currentDay = days[new Date().getDay()];

      if (campaign[currentDay] === 1) {
   

        const newSong = {
          title: campaign.CompanyName || "",
          genre: "",
          mood: "",
          duration: 0,
          artwork_url: "",
          playlink: campaign.localPath,
          companyValue: campaign.CompanyValue
        };
        songs.push(newSong);
      }
    }

    setCampaignArray1(songs);
  }

  async function convertCampaignsToSongWithType1(campaigns) {
    const songs = [];
    campaigns.sort((a, b) => a.CompanyValue - b.CompanyValue);
    
    for (let campaign of campaigns) {
      const companyValue = campaign.CompanyValue;
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const currentDay = days[new Date().getDay()];

      if (campaign[currentDay] === 1) {
      
      

        const durationInSeconds = companyValue * 60;
        const newSong = {
          title: campaign.CompanyName || "",
          genre: "",
          mood: "",
          duration: durationInSeconds,
          artwork_url: "",
          playlink: campaign.localPath,
          companyValue: campaign.CompanyValue,
        };
        songs.push(newSong);
      }
    }
    return songs;
  }

  function shufflePlaylist() {

    let shuffledArray = [];
    if (Object.values(props?.data?.selectedPlaylist)?.length > 0) {
      const songs = props?.data?.selectedPlaylist?.songs;

      songs.forEach(song => {
        shuffledArray.push({
          title: song.title || "",
          genre: song.genre || "",
          mood: song.mood || "",
          duration: song.duration || 0,
          artwork_url: song.artwork_url || "",
          playlink: song.localPath || ""
        });
      });

      shuffledArray = _.shuffle(shuffledArray);
      console.log("shufle", shuffledArray)
      setNewArray(shuffledArray);
    }
    else {
      console.log("else  buraya girdi")
    }
  }
  

  function campainJoinToPlaylist() {

    if (newArray.length > 0 && campainArray.length > 0) {

      let joinSongArray = [];
      let joinCampainArray = _.clone(campainArray);
      let counter = 1;

      _.each(newArray, (song, songIndex) => {
        const campaing = _.find(joinCampainArray, { 'companyValue': counter });

        if (campaing) {
          joinSongArray.push(song);
          joinSongArray.push(campaing);

          counter = 0;
          _.remove(joinCampainArray, campaing);
          if (joinCampainArray.length === 0) {
            joinCampainArray = _.clone(campainArray);
          }
        } else {
          joinSongArray.push(song);
        }
        counter++;
      });

      return joinSongArray;
    }
  }

  function campainJoinToPlaylist1() {
    if (newArray.length > 0 && campainArray1.length > 0) {
      let joinSongArray = [];
      let joinCampainArray = _.clone(campainArray1);
      let counter = 1;

      _.each(newArray, (song, songIndex) => {
        const campaing = _.find(joinCampainArray, { 'companyValue': counter });

        if (campaing) {
          joinSongArray.push(song);
          joinSongArray.push(campaing);

          counter = 0;
          _.remove(joinCampainArray, campaing);
          if (joinCampainArray.length === 0) {
            joinCampainArray = _.clone(campainArray1);
          }
        } else {
          joinSongArray.push(song);
        }
        counter++;
      });

      return joinSongArray;
    }
  }


  useEffect(() => {
    shufflePlaylist();
    convertCampaignsToSongs(props?.data?.campaigns.type2);
  }, [props?.data?.selectedPlaylist]);
  useEffect(() => {
 
    convertCampaignsToSongs(props?.data?.campaigns.type2);
  }, [props.data.campaigns]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentType2 = props?.data?.campaigns?.type2;
      const previousType2 = previousType2Ref.current;

      if (!_.isEqual(previousType2, currentType2)) {
        if (previousType2 !== null) {
          playNext(currentType2);
        }
        previousType2Ref.current = currentType2;
      }
    }, 1000 * 60 * 5);

    return () => clearInterval(interval);
  }, [props?.data?.campaigns?.type2]);


  const playNext = async (currentType2) => {
    shufflePlaylist();
    await convertCampaignsToSongs1(currentType2);
  };

  useEffect(() => {
    if (campainArray1?.length > 0) {
      setClonePlaylist(campainJoinToPlaylist1());
    } else {
      setClonePlaylist(newArray);
    }
  }, [campainArray1]);

  useEffect(() => {
    if (campainArray?.length > 0) {
    
      setSavedPlaylists(campainJoinToPlaylist());
    } else {
      console.log("newarray", newArray)
      setSavedPlaylists(newArray);
    }
  }, [campainArray, props?.data?.selectedPlaylist]);

  async function ezanDurumuKontrol() {
    return new Promise(function (resolve, reject) {
      fetch("https://app.cloudmedia.com.tr/api/isezan/" + props?.data?.user.id)
        .then(response => {
          if (!response.ok) {
            throw new Error("HTTP error, status = " + response.status);
          }
          return response.json();
        })
        .then(data => {
          console.log(data);
          EzanVaktiApi(data);
        })
        .catch(error => {
          console.error("Fetch Hatası:", error);
          reject(error);
        });
    });
  }


  function EzanVaktiApi(city) {
    let socket;

    function connectWebSocket() {
      if (city.city != "" && city.city && city.ezan === "True") {
        socket = new WebSocket("wss://ezansocket-v6fk.onrender.com");

        socket.onopen = function (event) {
          socket.send(city.city);
        };

        socket.onmessage = function (event) {
          console.log("WebSocket'ten mesaj alındı:", JSON.parse(event.data)["ezan"]);

          if (JSON.parse(event.data)["ezan"]["genelEzanDurumu"] === "Ezan Okunuyor" && city.ezan === "True") {
       
            ezanPlaying(JSON.parse(event.data)["ezan"]["dif"]);
          }
        };

        socket.onclose = function (event) {
          console.log("WebSocket bağlantısı kapatıldı.");
          setTimeout(connectWebSocket, 2000);
        };

        socket.onerror = function (error) {
          console.error("WebSocket hatası:", error);
        };
      } else {
        console.log("Şehir bilgisi bulunamadı. WebSocket bağlantısı kurulamadı.");
      }
    }

    connectWebSocket();
  }

  function ezanPlaying(dif) {

 
    setShowModal(true);
    pauseAudio();
    if (dif === 10) {
      setShowModal(false);
      playAudio();
    }
  }
  useEffect(() => {
    ezanDurumuKontrol();
  }, []);


  const turkishToEnglishDays = {
    'Paz': 'Sun',
    'Pzt': 'Mon',
    'Sal': 'Tue',
    'Çar': 'Wed',
    'Per': 'Thu',
    'Cum': 'Fri',
    'Cmt': 'Sat'
  };

  useEffect(() => {
    if (props.data.campaigns?.type0?.length > 0) {
      setCampainClone(props.data.campaigns?.type0);
    }
    function turkishToEnglishDay(turkishDay) {
      return turkishToEnglishDays[turkishDay] || turkishDay;
    }

    const intervalId = setInterval(async () => {
      const currentHour = new Date().getHours();
      const currentMinute = new Date().getMinutes();
      const options = { weekday: 'short' };
      const today = new Date();
      const dayFormatter = new Intl.DateTimeFormat('eu-US', options);
      const day = dayFormatter.format(today);
      let newday = turkishToEnglishDay(day);

      const matchedCampaign = campainClone?.find(campaign => {
        const [campaignHour, campaignMinute] = campaign?.CompanyValue.split(':');
        return parseInt(campaignHour) === currentHour && parseInt(campaignMinute) === currentMinute && campaign[newday] === 1;
      });

      if (matchedCampaign !== undefined) {
    
        campainAudioPlay(localUrl || "file://"+matchedCampaign.localPath);
        _.remove(campainClone, matchedCampaign);
        setCampainClone(campainClone);
      }
    }, 6000);

    return () => clearInterval(intervalId);
  }, [audioIndex, props.data.campaigns?.type0, campainClone])

  const campainAudioPlay = (audioUrl) => {
    if (audioUrl) {
      setCampainPlaying(true);
      const audioElement = document.getElementById('audio-player');
      const audioElement1 = document.getElementById('audio-player1');
      audioElement1.src = audioUrl;
      audioElement.pause();
      audioElement1.play();
      audioElement1.addEventListener('ended', campainAudioPause);
    }
  };

  const campainAudioPause = () => {
    setCampainPlaying(false);
    const audioElement = document.getElementById('audio-player');
    audioElement.play();
  };

  useEffect(() => {
    const audioElement = document.getElementById('audio-player');
    if (playing) {
      audioElement?.play();
    } else {
      audioElement?.pause();
    }
  }, [playing]);

  useEffect(() => {
    if (savedPlaylists.length > 0) {
      const audioUrl ="file://"+savedPlaylists[audioIndex]?.playlink;
      if (audioUrl) {
        const audioElement = document.getElementById('audio-player');
        audioElement.src = audioUrl;
        audioElement.load();
        if (playing) {
          audioElement.play();
        }
      }
    }
    convertCampaignsToSongWithType1(props.data.campaigns.type1)
  }, [audioIndex, props?.data?.click]);

  const playPrevious = () => {
    if (audioIndex > 0) {
      setAudioIndex(prevIndex => prevIndex - 1);
    }
  };

  const playAudio = () => {
    setPlaying(true);
  };

  const pauseAudio = () => {
    setPlaying(false);
  };

  useEffect(() => {
    const playNext = () => {
      if (audioIndex < savedPlaylists?.length - 1) {
        setAudioIndex(audioIndex + 1);
        if (clonePlaylist?.length > 0 && !_.isEqual(clonePlaylist, savedPlaylists)) {
          setSavedPlaylists(clonePlaylist);
        }
      } else {
        setAudioIndex(0);
      }
    };

    const audioElement = document.getElementById('audio-player');
    audioElement?.addEventListener('ended', playNext);

    return () => {
      audioElement?.removeEventListener('ended', playNext);
    };
  }, [audioIndex, savedPlaylists]);

  useEffect(() => {
    setAudioIndex(0);
    playAudio();
  }, [props?.data?.savedPlaylists]);

  useEffect(() => {
    const audioUrl ="file://"+savedPlaylists[audioIndex]?.playlink;
    if (audioUrl) {
      const audioElement = document.getElementById('audio-player');
      audioElement.src = audioUrl;
      audioElement.load();
    }
  }, []);


  let TimeCounter = useRef(0);
  let MinuteCounter = useRef(0);
  let toPlaylist = useRef([]);

  const checkCampaignPlay = () => {
    const campaignSongs = convertCampaignsToSongWithType1(props.data.campaigns.type1);
    console.log(TimeCounter.current, campaignSongs);
    const audioElement = document.getElementById('audio-player');
    TimeCounter.current++;

    if (TimeCounter.current % 60 === 0) {
      try {
        MinuteCounter.current++;

        campaignSongs.forEach((item) => {
          if (MinuteCounter.current % parseInt(item?.companyValue) === 0) {
            toPlaylist.current.push(item);
          }
        });

        if (toPlaylist.current.length > 0) {
          audioElement.addEventListener("ended", playCampaignSong);
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const playCampaignSong = () => {
    if (toPlaylist.current.length === 0) return;

    setPlaying(false);
    const audioElement = document.getElementById('audio-player');
    audioElement.pause();

    if (toPlaylist.current.length > 1) {
      toPlaylist.current = [toPlaylist.current[toPlaylist.current.length - 1]];
    }

    const audioElement1 = document.getElementById('audio-player1');
    for (const item of toPlaylist.current) {
   
      audioElement1.src = "file://"+item.playlink;
    }

    audioElement1.play();
    audioElement1.addEventListener('ended', () => {
      setPlaying(true);
      audioElement.play();
      toPlaylist.current = [];
      audioElement1.removeEventListener('ended', playCampaignSong);
    });
  };

  useEffect(() => {
    const campaignSongs = convertCampaignsToSongWithType1(props.data.campaigns.type1);
    let interval;
    if (campaignSongs.length > 0 && savedPlaylists.length > 0) {
      interval = setInterval(() => {
        checkCampaignPlay();
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [props.data.campaigns.type1, savedPlaylists]);

  const syncVolume = () => {
    if (audioRef1.current && audioRef2.current) {
      audioRef1.current.volume = volumeLevel;
      audioRef2.current.volume = volumeLevel;
    }
  };

  const handleVolumeChange = (e) => {
    const newVolumeLevel = parseFloat(e.target.value);
    setVolumeLevel(newVolumeLevel);
    syncVolume();
  };

  const music ="file://"+savedPlaylists[audioIndex]?.playlink;


  return (
    <>
      <div style={{ display: "flex", flexDirection: "row", }} className="audio-player">
        <div className="audio-controls">
          {playing ? (
            <img src={pause} alt="" onClick={pauseAudio} />
          ) : (
            <img src={play} alt="" onClick={playAudio} />
          )}
        </div>
        <div className='song-info'>
          <img src={savedPlaylists[audioIndex]?.artwork_url} alt="" />
          <div className='text-container'>
            <span className='playlist-text'>{props?.data?.selectedPlaylist.playlistName}</span>
            <span className='song-text'>{savedPlaylists[audioIndex]?.title}</span>
          </div>
        </div>
        <div className='icon-container'>
          <img src={volume} alt="" onClick={() => setShowVolumeControl(true)} />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volumeLevel}
            onChange={handleVolumeChange}
            className="volume-slider"
          />
        </div>
      </div>
      <div>
        <audio id="audio-player" ref={audioRef1} src={music}  autoPlay={playing}   />
        <audio id="audio-player1" ref={audioRef2} autoPlay={campainPlaying} />
      </div>
      <div className="modal-container">
        {showModal===true && (
          <div className="modal">
            <div className="modal-content">
              <p>Ezan vakti. <br /> Yayın kısa süre sonra devam edecek </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AudioPlayer;