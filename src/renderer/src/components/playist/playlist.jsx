import { useEffect, useState } from "react";
import "./playlist.css";
import Player from "../player/player";
import axios from "axios";
import _ from "lodash";
import logout from "./Log_Out.png";

function Playlist(props) {
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const [click, setClick] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredPlaylists, setFilteredPlaylists] = useState([]);
    const user = props?.data?.user?.user;
    const campaigns = props?.data?.campaigns;
    const [showLogout, setShowLogOut] = useState(false);
   
  
    useEffect(() => {
        const results = props?.data?.allPlaylists?.filter(playlist =>
            playlist?.playlistName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredPlaylists(results);
    }, [searchTerm, props?.data?.allPlaylists]);

    useEffect(() => {
        // Otomatik çalma için ilk playlist'i seç
        if (props?.data?.allPlaylists && props.data.allPlaylists.length > 0) {
            const firstPlaylist = props.data.allPlaylists[0];
            setSelectedPlaylist(prev => {
                // Eğer önceki seçili playlist ile yeni gelen aynı değilse güncelle
                if (!prev || prev.playlistId !== firstPlaylist.playlistId) {
                    setClick(prevClick => prevClick + 1);
                    return firstPlaylist;
                }
                return prev;
            });
        }
    }, [props?.data?.allPlaylists]);
  

    useEffect(() => {
        console.log("Selected Playlist:", selectedPlaylist);
    }, [selectedPlaylist]);

    const handlePlaylistClick = (playlist) => {
        setSelectedPlaylist(playlist);
        setClick(prevClick => prevClick + 1);
    };

    const logOut = () => {
        setShowLogOut(true);
    };

    async function checkStatus() {
        const res = await axios.post(`https://app.cloudmedia.com.tr/api/updateUserStatusApi/${user.id}/offline`).then(res => {
            return res
        })
        return res
    }

    const logOut2 = () => {
        checkStatus().then(res => {
            if (res.data.status === "success") {
                window.electron.ipcRenderer.send("log-out", "log-out");
                window.location.reload();
            }
        })
    };

    return (
        <>
            <div style={{ width: window.innerWidth, marginBottom: "150px" }}>
                <div className="frame">
                    <div className="div-wrapper">
                        <div className="text-wrapper">{user?.name}</div>
                    </div>
                    <div className="div">
                        <input
                            className="r-n-kategori-veya"
                            placeholder="Ara"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="logout">
                        <img
                            style={{ cursor: "pointer" }}
                            alt="Interface log out"
                            src={logout}
                            onClick={() => logOut()}
                        />
                    </div>
                </div>

                <div className="playlist-container">
                    {(searchTerm ? filteredPlaylists : props?.data?.allPlaylists)?.map(res => {
                        return (
                            <div
                                className="playlist"
                                key={res?.playlistName}
                                style={{ cursor: "pointer" }}
                                onClick={() => handlePlaylistClick(res)}
                            >
                                <img src={res.playlistImage} alt={res.playlistName} />
                                <span>{res.playlistName}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 99999 }}>
                {selectedPlaylist && <Player data={{ selectedPlaylist, user, click, campaigns }} />}
            </div>

            {showLogout && (
                <div className="modal2" style={{ display: 'block' }}>
                    <div className="modal-content2">
                        <p>Çıkış yapmak istiyor musun?</p>
                        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: "20px" }}>
                            <button className='btn-mes1' onClick={() => logOut2()}>Evet</button>
                            <button className='btn-mes1' onClick={() => setShowLogOut(false)}>Hayır</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Playlist;