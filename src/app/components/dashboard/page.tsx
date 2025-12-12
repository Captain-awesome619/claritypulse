"use client";
import { useState , useEffect} from "react";
import { useProfileStore } from "@/store/userProfile";
import { FaGlobe } from "react-icons/fa";
import { GrProjects } from "react-icons/gr";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import logo from '../../../assests/backgroundlogo.png';
import { PulseLoader } from "react-spinners";
import { FaCopy } from "react-icons/fa";
import { IoMdCheckmark } from "react-icons/io";
import { MdDeleteForever } from "react-icons/md";
import { getSupabaseClient } from "@/lib/supaBaseClient";
import Modal from "react-modal";

import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { profile, users, setLink, setFeedback, link, feedback } = useProfileStore();
Modal.setAppElement("body");
const supabase = getSupabaseClient();

  const [projectName, setProjectName] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
const [copied, setCopied] = useState(false);
 const [snippet, setSnippet] = useState("");
const [site, setSite] = useState("");
const [prof, setProf] = useState("");
 const [noEventsModal, setNoEventsModal] = useState(false);
 const [deleteModal, setDeleteModal] = useState(false);
const [deleting, setDeleting] = useState(false);
const navigate = useRouter()
  
 useEffect(() => {
  const loadUserData = async () => {
    try {
      // 1. Get the authenticated user once
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.log("Auth error:", authError);
        return;
      }

      if (!authUser) {
        console.log("No Supabase user logged in");
        return;
      }

      console.log("User ID:", authUser.id);

      // ------------------------------------
      // 2. Fetch PROFILE for this user
      // ------------------------------------
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (profileError) {
        console.log("Profile fetch error:", profileError.message);
      } else {
        console.log("Profile:", profileData);
       setProf(profileData?.username); 
console.log('this is prof', prof)
      }
 
      // ------------------------------------
      // 3. Fetch PROJECT for this user
      // ------------------------------------
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (projectError) {
        console.log("Project fetch error:", projectError.message);
        return;
      }

      console.log("Project snippet:", project?.snippet);

      if (project) {
        setSite(project.domain || "");
        setSnippet(project.snippet || "");
        setName(project.project_name || "");
      }

    } catch (err) {
      console.log("Unexpected error:", err);
    }
  };

  loadUserData();
    loadUserData().finally(() => setInitialLoading(false)); 
}, [prof]);

  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.4 } },
    exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0, transition: { duration: 0.4 } }),
  };
  function validateProjectName(name: string) {
    if (!name.trim()) return "Project name cannot be empty.";
    const regex = /^[a-zA-Z0-9-_ ]+$/;
    if (!regex.test(name)) return "Project name contains invalid characters.";
    return "";
  }
  function validateDomain(url: string) {
    if (!url.trim()) return "Website URL cannot be empty.";
    try {
      new URL(url);
      return "";
    } catch {
      return "Please enter a valid URL.";
    }
  }
  async function createProject() {
    setError("");

    const domainError = validateDomain(domain);
    if (domainError) {
      setError(domainError);
      return;
    }
    if (!users?.session?.access_token) {
      setError("User not authenticated.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("/api/create-project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${users.session.access_token}`,
        },
        body: JSON.stringify({ domain, project_name: projectName, }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
console.log('this is data', data)
      setFeedback(data?.project?.project_name || "Project created successfully!");
      setSnippet(data?.snippet || "");
    
    } catch {
      setError("Failed to create project.");
    } finally {
      setLoading(false);
    }
  }
async function viewMetrics() {
  setLoading(true); // <-- Show loader immediately

  try {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      console.log("User not authenticated.");
      setLoading(false);
      return;
    }

    // Fetch the user's project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (projectError) {
      console.log("Could not fetch project:", projectError.message);
      setLoading(false);
      return;
    }

    if (!project) {
      console.log("No project found for this user.");
      setLoading(false);
      return;
    }

    // Save project ID globally
    setLink(project.id || "");

    // Fetch events for this project
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .eq("project_id", project.id);

    if (eventsError) {
      console.log("Error fetching events:", eventsError.message);
      setLoading(false);
      return;
    }

    // If no events → stop loader → show modal
    if (!events || events.length === 0) {
      console.log("No events yet.");
      setLoading(false);

      // delay 300ms so loader fades first
      setTimeout(() => {
        setNoEventsModal(true);
      }, 300);

      return;
    }

   
    navigate.push("/components/Metrics");
    setLoading(false);
  } catch (err) {
    console.log("Unexpected error:", err);
    setLoading(false);
  }
}

async function deleteProjectAndEvents() {
  setDeleting(true);

  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      console.log("Not authenticated");
      setDeleting(false);
      return;
    }

    // Get project
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (!project) {
      console.log("No project found");
      setDeleting(false);
      return;
    }

    // Delete events first (foreign key friendly)
    await supabase
      .from("events")
      .delete()
      .eq("project_id", project.id);

    // Delete project
    await supabase
      .from("projects")
      .delete()
      .eq("id", project.id);

    // Reset UI after delete
    setSnippet("");
    setSite("");
    setFeedback("");
    setLink("");
    setDeleteModal(false);
  } catch (err) {
    console.log("Delete error:", err);
  }

  setDeleting(false);
}

 if (initialLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center  backdrop-blur-md z-50  h-screen w-screen flex-col  bg-no-repeat bg-cover bg-bottom-left "
       style={{ backgroundImage: "url('/dashboardbg2.jpg')" }}
      >
        <PulseLoader color="purple" size={15} />
      </div>
    );
  }

  return (
    <main className={`relative px-2 lg:px-0  h-screen w-screen flex flex-col  bg-no-repeat bg-cover bg-bottom-left ${ !snippet ? " justify-center items-center  " : ""}`}
      style={{ backgroundImage: "url('/dashboardbg2.jpg')" }}
    >
{loading && (
  <div className="fixed inset-0  bg-opacity-70 backdrop-blur-md flex items-center justify-center z-50">
    <PulseLoader color="blue" size={15} />
  </div>
)}


      {snippet ? (
        <div className="relative lg:p-8  pt-4 ">
        <div className="  lg:w-[550px] lg:h-[380px] bg-gray-700 rounded-2xl border-2 border-green-300 flex flex-col justify-between">
<div className="flex flex-col p-4 gap-4">
<h3 className="text-green-300  font-mono font-bold lg:text-[18px]"> {name ? <span>{name}</span> : <span>{projectName}</span>}</h3>
<h3 className="text-green-300  font-mono font-bold lg:text-[18px]"> {site ? <span>{site}</span> : <span>{domain}</span>}</h3>
<div className=" flex flex-col gap-3">
<div >
<h3 className="text-[13px] bg-linear-to-r from-purple-500 via-violet-500 to-blue-500 bg-clip-text text-transparent font-mono font-bold lg:text-[18px]">
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
        <IoMdCheckmark  className="text-green-300"/>
      ) : (
        <FaCopy className="transition-opacity duration-300 text-green-300" />
      )}
    </button>
</div>
<h3 className="text-green-300 font-mono font-bold">
  Copy and Paste the script above into the {'<Head> , <body> or parent tag '} section of your code.
</h3>
</div>
</div>
<div className="p-4 flex items-center justify-between">
  <button className="cursor-pointer px-4 py-3 rounded-3xl text-black bg-green-300 font-mono font-bold" onClick={viewMetrics}>
    View metrics
  </button>

<MdDeleteForever className="text-red-400 cursor-pointer" size={25}  onClick={() => setDeleteModal(true)}/>

</div>
        </div>
        </div>
      ) : (
        <div
          className={`relative px-2 w-[370px]  lg:w-[400px] mb-3 h-[500px] border-2 border-transparent rounded-3xl z-40 bg-cover bg-bottom-right bg-no-repeat lg:p-8
          shadow-[0_10px_10px_-10px_rgba(186,85,255,0.6),0_15px_20px_-1px_rgba(255,105,180,0.6),0_40px_90px_-20px_rgba(65,105,225,0.6)]
          overflow-hidden flex items-center justify-center transition-all duration-700 ease-in-out ${loading ? "opacity-50 pointer-events-none  " : ""}`}
          style={{ backgroundImage: "url('/landingbackground.svg')" }}
        >
          <AnimatePresence custom={direction} mode="wait">
            {/* STEP 1 */}
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full flex flex-col justify-around h-full"
              >
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="rounded-[40%] bg-black flex items-center justify-center w-15 h-15">
                    <Image src={logo} height={50} width={50} alt="logo" />
                  </div>
                  <h3 className="text-black font-figtree font-bold text-[20px] text-center">
                    😁 Hello {prof}! Let's kick off your project setup.
                  </h3>
                </div>

                <div className="w-full flex flex-col gap-2">
                  <h4 className="text-black font-figtree font-bold text-[13px]">
                    Please enter the name of your project
                  </h4>

                  <div className="flex items-center pl-2 bg-gray-300 rounded-2xl h-12">
                    <GrProjects size={17} color="black" />
                    <input
                      type="text"
                      className="outline-none bg-transparent px-2 text-black placeholder-gray-400 font-figtree font-semibold w-full"
                      placeholder="Your project name..."
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                    />
                  </div>
                  {error && step === 1 && <p className="text-red-500 text-sm">{error}</p>}
                </div>

                <div className="ml-auto cursor-pointer">
                  <button
                    className="px-6 py-2 rounded-2xl bg-white border-2 border-black cursor-pointer"
                    onClick={() => {
                      const nameError = validateProjectName(projectName);
                      if (nameError) {
                        setError(nameError);
                        return;
                      }
                      setError("");
                      setDirection(1);
                      setStep(step + 1);
                    }}
                  >
                    <h3 className="text-black font-figtree font-bold">Next</h3>
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full flex flex-col justify-around h-full"
              >
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="rounded-[40%] bg-black flex items-center justify-center w-15 h-15">
                    <Image src={logo} height={50} width={50} alt="logo" />
                  </div>
                  <h3 className="text-black font-figtree font-bold text-[20px] text-center">
                    You are almost there💫.
                  </h3>
                </div>

                <div className="w-full flex flex-col gap-1">
                  <h4 className="text-black font-figtree font-bold text-[13px]">
                    Paste your website URL
                  </h4>

                  <div className="relative flex items-center pl-2 bg-gray-300 rounded-2xl h-12 w-full animated-border">
                    <FaGlobe size={17} color="black" />
                    <input
                      type="text"
                      className="outline-none bg-transparent px-2 text-black placeholder-gray-400 font-figtree font-semibold w-full"
                      placeholder="Your Website URL..."
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                    />
                  </div>
                  {error && step === 2 && <p className="text-red-500 text-sm">{error}</p>}
                </div>

                <div className="flex justify-between items-center w-full">
                  <div className="cursor-pointer" onClick={() => { setDirection(-1); setStep(step - 1); }}>
                    <button className="bg-black px-6 py-2 rounded-2xl border-2 border-black cursor-pointer">
                      <h3 className="text-white font-figtree font-bold">Back</h3>
                    </button>
                  </div>

                  <div className="ml-auto cursor-pointer">
                    <button
                      className="px-6 py-2 rounded-2xl bg-white border-2 border-black cursor-pointer"
                      onClick={createProject}
                      disabled={loading}
                    >
                      <h3 className="text-black font-figtree font-bold">
                        Create
                      </h3>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      )}
      <Modal
  isOpen={noEventsModal}
  onRequestClose={() => setNoEventsModal(false)}
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
  <h2 className="text-black font-semibold text-lg mb-3">
    😅No Data Available
  </h2>
  <p className="text-gray-600 font-medium mb-6">
    There are no events yet to display metrics for.
  </p>

  <button
    onClick={() => setNoEventsModal(false)}
    className="bg-black text-white px-4 py-2 rounded-xl font-semibold cursor-pointer"
  >
    Okay
  </button>
</Modal>


<Modal
  isOpen={deleteModal}
  onRequestClose={() => setDeleteModal(false)}
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
  <h2 className="text-black font-semibold text-lg mb-3">
    ⚠️ Delete Project?
  </h2>

  <p className="text-gray-600 font-medium mb-6">
    This action cannot be undone. All events and your project will be deleted.
  </p>

  <div className="flex justify-between mt-6">
    <button
      onClick={() => setDeleteModal(false)}
      className="px-4 py-2 rounded-xl font-semibold bg-gray-300 text-black cursor-pointer"
    >
      Cancel
    </button>

    <button
      onClick={deleteProjectAndEvents}
      className="px-4 py-2 rounded-xl font-semibold bg-red-500 text-white cursor-pointer"
      disabled={deleting}
    >
      {deleting ? "Deleting..." : "Delete"}
    </button>
  </div>
</Modal>

    </main>
  );
}
