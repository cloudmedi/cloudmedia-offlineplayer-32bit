import React, { useState, useEffect } from 'react';
import { PiPauseCircleLight } from "react-icons/pi";
import { PiPlayCircleLight } from "react-icons/pi";
import _ from "lodash"
import './player.css';
import axios from 'axios';

const AudioPlayer = (props) => {
 const [array,setNewArray]=useState([])
  const [audioIndex, setAudioIndex] = useState(0); // State to hold current audio index
  const [playing, setPlaying] = useState(false); // State to track playing status
  const [playedSongs, setPlayedSongs] = useState([]);
  const [campainPlaying, setCampainPlaying]=useState(false)
  const [groupedCampaigns, setGroupedCampaigns] = useState({
    type0: [],
    type1: [],
    type2: []
  });
const [songData,setSongData]=useState([]);
const [audioUrl,setAudioUrl]=useState("");
const [playedCampaigns, setPlayedCampaigns] = useState(new Set());

  async function getCampaigns() {
    const camApi="https://app.cloudmedia.com.tr/api/comapi/";
    const userId = props.data.props.data.user.user.id;
    await axios.get(`${camApi}${userId}`).then(res => {
     
      const campaigns = res.data;
     
      const newGroupedCampaigns = {
        type0: [],
        type1: [],
        type2: []
      };

      campaigns.forEach(campaign => {
        newGroupedCampaigns['type' + campaign.CompanyType].push(campaign);
      });

      setGroupedCampaigns(newGroupedCampaigns);
    }).catch(error => {
      console.error('Error fetching campaigns:', error);
    });
  }

  useEffect(() => {
   
   
    const intervalId = setInterval(() => {

      const currentHour = new Date().getHours();
      const currentMinute = new Date().getMinutes();
      const currentSecond = new Date().getSeconds();
      const today = new Date();
      const options = { weekday: 'short' };
      const day = today.toLocaleDateString('eu-US', options);
     
        const matchedCampaign = groupedCampaigns.type0.find(campaign => {
         
          const [campaignHour, campaignMinute] = campaign.CompanyValue.split(':');
          return parseInt(campaignHour) === currentHour && parseInt(campaignMinute) === currentMinute&&campaign[day]===1
        });

        if (matchedCampaign) {
          campainAudioPlay(matchedCampaign.path);
        }
     
   
    }, 6000); // Her dakika kontrol etmek için

    return () => clearInterval(intervalId);
  
  

    
  }, [groupedCampaigns,playedSongs]);

  const playAudio = () => {
    setPlaying(true);
  };
  const campainAudioPlay = (audioUrl) => {
    if (audioUrl) { // Check if audioUrl exists
      setCampainPlaying(true);
      const audioElement = document.getElementById('audio-player');
      const audioElement1 = document.getElementById('audio-player1');
      audioElement1.src = audioUrl;
      audioElement.pause()
      audioElement1.play();
      audioElement1.addEventListener('ended', campainAudioPause)
    }
  };
  const campainAudioPause = () => {
   // Check if audioUrl exists
      setCampainPlaying(false);
      const audioElement = document.getElementById('audio-player');
      audioElement.play();
    
  };

  const pauseAudio = () => {
    setPlaying(false);
  };

  const playNext = () => {
   
    if (Object.values(props.data.selectedPlaylist).length > 0) {
      const totalSongs = props.data.selectedPlaylist?.songs[0].song.length;
      let randomIndex = Math.floor(Math.random() * totalSongs);
     
      // Keep generating random index until it's not in playedSongs
      while (playedSongs.includes(randomIndex)) {

        randomIndex = Math.floor(Math.random() * totalSongs);
      }
      
    
      // Reset playedSongs array if all songs are played
      if (playedSongs.length === totalSongs) {
        setPlayedSongs([]);
      } 
   
      setAudioIndex(randomIndex);
      console.log('Playing next audio');
    }
  };
  

  const playPrevious = () => {
    if (Object.values(props.data.selectedPlaylist).length > 0) {
      const previousIndex = (audioIndex - 1 + props?.data?.selectedPlaylist?.songs[0].song?.length) % props?.data?.selectedPlaylist?.songs[0].song?.length;
      setAudioIndex(previousIndex);
      console.log('Playing previous audio');
    }
  };
 
 useEffect(()=>{
  if (Object.values(props.data.selectedPlaylist).length > 0&&props.data.selectedPlaylist.songs[0].song) {
   
    setAudioUrl(props.data.selectedPlaylist.songs[0].song[audioIndex]?.playlink) 
 setSongData(props.data.selectedPlaylist.songs[0].song[audioIndex]);
 const updatedPlayedSongs = [...playedSongs, audioIndex];
 setPlayedSongs(updatedPlayedSongs);

  }
 },[audioIndex])
  useEffect(() => {
    const audioElement = document.getElementById('audio-player');
    audioElement.addEventListener('ended', playNext);

    return () => {
      audioElement.removeEventListener('ended', playNext);
    };
  }, [props.data]); // Listen to changes in props.data
 
  useEffect(() => {
    const audioElement = document.getElementById('audio-player');
    if (audioElement) {
      if (playing) {
        audioElement.play();
      } else {
        audioElement.pause();
      }
    }

    
  }, [playing]); // Listen to changes in playing state

  useEffect(()=>{
    if (Object.values(props.data.selectedPlaylist).length > 0&&props.data.selectedPlaylist.songs[0].song) {
      const totalSongs = props.data.selectedPlaylist?.songs[0].song.length;
      const randomIndex = Math.floor(Math.random() * totalSongs);
      setAudioIndex(randomIndex);
  
 
     
    }
  },[props.data])
 //console.log(props.data.selectedPlaylist)
  useEffect(() => {
    if(Object.values(props.data.selectedPlaylist).length > 0){
      playAudio();
    
    }
    // Otomatik çalma işlemini gerçekleştir
   
  }, [props.data])

  useEffect(() => {
    setPlayedSongs([]); // playedSongs'u sıfırla
  }, [props.data]);
  function shufflePlaylist() {
    let shuffledArray = []; // Yeni bir dizi oluştur
    if (Object.values(props.data.selectedPlaylist).length > 0 && props.data.selectedPlaylist.songs[0].song) {
      const selectedPlaylist = props.data.selectedPlaylist;
      const songs = selectedPlaylist?.songs[0]?.song;
  
      songs.forEach(song => {
        shuffledArray.push({ // Yeni diziye karıştırılmış şarkıları ekle
          title: song.title || "",
          genre: song.genre || "",
          mood: song.mood || "",
          duration: song.duration || 0,
          artwork_url: song.artwork_url || "",
          playlink: song.playlink || ""
        });
      });
      
      shuffledArray = _.shuffle(shuffledArray); // Tüm şarkıları karıştır
      setNewArray(shuffledArray); // Karıştırılmış diziyi ayarla
    }
  }
  
  useEffect(()=>{
shufflePlaylist()

  },[props.data])

  return (<>
    <div style={{display:"flex",flexDirection:"row",justifyContent:"space-between"}} className="audio-player">
      <div className="audio-controls">
      
      {playing ? (
        <button onClick={pauseAudio}><PiPauseCircleLight style={{width:"100px",height:"100px"}} fill='black' /></button>
      ) : (
        <button onClick={playAudio}><PiPlayCircleLight style={{width:"100px",height:"100px"}} fill='black' />
        </button>
      )}
      
    </div>
      <div className='song-info'>
        <img src={array.artwork_url} alt="" srcset="" />
          
          <div className='text-container'>
          <span style={{fontSize:"22px"}}>{props?.data?.selectedPlaylist.playlistName}</span>
          <span>{array.title}</span>
          </div>
      </div>
      
     
      
    </div>
    <div>
       <audio id="audio-player" src={array} controls  autoPlay={playing} />
       <audio id="audio-player1"   autoPlay={campainPlaying} />
    </div>
    </>
  );
};

export default AudioPlayer;
