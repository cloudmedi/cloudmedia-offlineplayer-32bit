import react, { useState } from "react"
import "./home.css"
import logo from "../../assets/wpare.png"
import logo1 from "../../assets/icon.png"
import axios from "axios"

//import Playlist from "../playlist/playlist"

function Home() {


const [mail,setMail]=useState("")
const [password,setPasword]=useState("")


async function login() {
    try {
         await axios.post("https://app.cloudmedia.com.tr/api/auth/login", {
            email: mail,
            password: password
        }, {
            headers: {
                "Content-Type": "application/json",
            }
        }).then(response=>{
           
            if(response.data){

                
             window.electron.ipcRenderer.send("login-info", response?.data);
            
             window.location.reload()
            }
        });
      
    } catch (error) {
        console.error("Login error:", error);
    }
}




    return (
        <div className="home-container">
            <div className="home-logo">
                <img src={logo} alt="" srcset="" />
            </div>
            <div className="home-login">
                <div><img src={logo1} alt="" srcset="" /></div>

                <div style={{width:"317px",top:"136px"}}>
                   <div style={{width:"317px"}}>
                   <label className="hos"> Hoş Geldiniz</label>
                   <label className="hos1" style={{marginTop:"20px"}}> E-posta</label>
                    <input type="text" onChange={(e)=>setMail(e.target.value)} />
                   </div>
                   <div style={{width:"317px",marginTop:"20px"}}>
                   <label  className="hos1"> Şifre</label>
                    <input type="password" onChange={(e)=>setPasword(e.target.value)}   />
                   </div>
                   <div style={{display:"flex",justifyContent:"center",marginTop:"10px"}}>
                  <button type="button" onClick={login}>Giriş Yap</button>  
                
                   </div>
                </div>
            </div>
        </div>
    )
}


export default Home