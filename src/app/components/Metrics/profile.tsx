"use client"
import React from 'react'
import { getSupabaseClient } from '@/lib/supaBaseClient';
import { useEffect, useState } from "react";
import { PulseLoader } from 'react-spinners';
import { useProfileStore } from '@/store/userProfile';
import { FaCopy } from "react-icons/fa";
import { IoMdCheckmark } from "react-icons/io";
import Modal from "react-modal";
import { useRouter } from "next/navigation";


interface Profile {
  username: string;
  [key: string]: any;
}
Modal.setAppElement("body");

const Profile = () => {
const [prof, setProf] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
 const [snippet, setSnippet] = useState("");
const [site, setSite] = useState("");
const [auth, setauth] = useState("");
const [copied, setCopied] = useState(false);
 const [isOpen, setIsOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [updating, setUpdating] = useState(false);
 const {  feedback } = useProfileStore();
const supabase = getSupabaseClient();
useEffect(() => {
     const loadUserData = async () => {
         setLoading(true);
    try {
      // 1. Get the authenticated user once
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
     alert("Error fetching user: " + authError.message);
        return;
      }

      if (!authUser) {
      alert("User not authenticated.");
        return;
      }

   
setauth(authUser.id);
      // ------------------------------------
      // 2. Fetch PROFILE for this user
      // ------------------------------------
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (profileError) {
      alert("Error fetching profile: " + profileError.message);
      } else {
     
       setProf(profileData); 

      }
 
      // ------------------------------------
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (projectError) {
        alert("Error fetching project: " + projectError.message);
        return;
      }

   

      if (project) {
        setSite(project.domain || "");
        setSnippet(project.snippet || "");
      }
    } catch (err) {
      console.log("Unexpected error:", err);
    }
    
     setLoading(false);
  };
loadUserData();
  }, [ ]); 

 const handleUsernameUpdate = async () => {
    if (!newUsername.trim()) return;

    setUpdating(true);

    const { error } = await supabase
      .from("profiles")
      .update({ username: newUsername })
      .eq("id", auth);

    setUpdating(false);

    if (!error) {
      // Update UI
      setProf((prev) => ({ ...prev, username: newUsername }));
      setIsOpen(false);
      setNewUsername("");
        
    } else {
      console.log("Update error:", error.message);
    }
  };

  return (
    <div className=''>
      {loading ? <PulseLoader/> :
      
      <div className='grid gap-6 '>
      
      <div className='flex flex-row  items-center justify-between'>
        <div className='flex flex-col '>
<h4 className='lg:text-[25px] font-bold font-mono text-[18px] text-[#0A3D62] '>{prof?.username}</h4>
<div className='flex items-center justify-center  text-[12px] font-bold font-figtree text-[#0A3D62]'>(Joined {""}{new Date(prof?.created_at).toDateString()})</div>
</div>
<div>
 <button
              className="lg:px-3 lg:py-2 px-2 py-2 rounded-3xl 
              bg-[#0A3D62]
              shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center lg:gap-2 gap-1"
             onClick={() => setIsOpen(true)}
            >
              <h4 className=" text-white font-mono font-bold text-[11px] lg:text-[13px] ">Change Username</h4>
            </button>
            </div>
      </div>
      <div className='flex-col items-center gap-2'>
  <h4 className='lg:text-[25px] font-bold font-mono text-[#0A3D62]'>{feedback}</h4>
  <h4 className='lg:text-[15px] font-bold font-mono text-[#0A3D62]'>{site}</h4>
  </div>
  <div className='flex '>
  <h3 className="bg-linear-to-r from-[#0A3D62] via-violet-500 to-blue-500 bg-clip-text text-transparent font-mono font-bold lg:text-[18px] text-[10px]">
  {snippet}
</h3>
<button
      onClick={() => {
        navigator.clipboard.writeText(snippet);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-end justify-end cursor-pointer ml-2 transition-all duration-300"
    >
      {copied ? (
        <IoMdCheckmark  className="text-purple-600 lg:text-[15px] text-[12px]"/>
      ) : (
        <FaCopy className="transition-opacity duration-300 text-[#0A3D62] lg:text-[15px] text-[12px]" />
      )}
    </button>
</div>
 <h4 className='lg:text-[15px] font-bold font-mono text-[#0A3D62]'>User_Id: {""}{prof?.id}</h4>
    <Modal
            isOpen={isOpen}
            onRequestClose={() => setIsOpen(false)}
            style={{
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      transform: "translate(-50%, -50%)",
      padding: "30px",
      borderRadius: "16px",
      background: "white",
      width: "350px",
      textAlign: "center",
    },
    overlay: {
      backgroundColor: "rgba(0,0,0,0.6)",
      zIndex: 1000,
    },
  }}
          >
            <h2 className="font-bold text-lg mb-4">Change Username</h2>

            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Enter new username"
              className="w-full px-3 py-2 border rounded-md outline-none"
            />

            <button
              onClick={handleUsernameUpdate}
              className="mt-4 w-full bg-[#0A3D62] text-white py-2 rounded-lg font-bold flex items-center justify-center cursor-pointer"
            >
              {updating ? <PulseLoader color='blue' size={8} /> : "Update Username"}
            </button>
          </Modal>

    </div>}
    </div>
  )
}

export default Profile
