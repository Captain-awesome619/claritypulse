"use client"; 
import { FormEvent, useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Image from "next/image";
import Logo from "../assests/backgroundlogo.png";
import { IoEnterOutline } from "react-icons/io5";
import { IoMdMail, IoMdEye } from "react-icons/io";
import { FaLock, FaLinkedinIn } from "react-icons/fa6";
import { IoLogoWhatsapp } from "react-icons/io";
import { BsGlobe } from "react-icons/bs";
import { GrDocumentUser } from "react-icons/gr";
import { MdOutlineMan } from "react-icons/md";
import { ImCool2 } from "react-icons/im";
import { getSupabaseClient } from "@/lib/supaBaseClient";
import { ClipLoader } from "react-spinners";
import { useRouter } from "next/navigation";
import { useProfileStore } from "@/store/userProfile";
import Modal from 'react-modal';
import { PulseLoader } from "react-spinners";
interface FormFields {
  name: string;
  username: string;
  email: string;
  password: string;
}

interface FormErrors {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
}
export default function Home() {
  const [account, setAccount] = useState(true); // true = login, false = signup
  const [form, setForm] = useState<FormFields>({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const supabase = getSupabaseClient();
const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false); // ⬅ loading state
 const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const validateField = (field: keyof FormFields, value: string): string | undefined => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    const usernameRegex = /^.{5,}$/;
    switch (field) {
      case "email":
        if (!value.trim()) return "Email is required.";
        if (!emailRegex.test(value)) return "Please enter a valid email.";
        break;
      case "password":
        if (!value.trim()) return "Password is required.";
        if (!passwordRegex.test(value))
          return "Password must be at least 8 characters, include a number and a special character.";
        break;
      case "name":
        if (!value.trim()) return "Name is required.";
        break;
      case "username":
        if (!value.trim()) return "Username is required.";
        if (!usernameRegex.test(value)) return "Username must be at least 5 characters.";
        break;
    }
    return undefined;
  };
  const validateAll = (): boolean => {
    const newErrors: FormErrors = {};
    (Object.keys(form) as (keyof FormFields)[]).forEach((field) => {
      const error = validateField(field, form[field]);
      if (error) newErrors[field] = error;
    });

    if (account) {
      delete newErrors.name;
      delete newErrors.username;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
const router = useRouter();
 const { setProfile,setUser } = useProfileStore();


const handleSubmit = async (
  e: FormEvent<HTMLFormElement>
): Promise<void> => {
  e.preventDefault();
 

  try {
    setLoading(true);

    if (account) {
      // ---------- LOGIN ----------
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });

      if (error || !data.user) {
        alert("Invalid Credentials");
        return;
      }

      setUser(data);
      setProfile(data.user);
      await new Promise(res => setTimeout(res, 500));
      router.push("/components/dashboard");

    } else {
      // ---------- SIGNUP ----------
       if (!validateAll()) return;
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
      });

      if (error) {
        alert(error.message);
        return;
      }

      if (!data.user) {
        alert("Signup initiated. Please check your email to verify your account.");
        return;
      }

      const userId = data.user.id;

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert([
            {
              id: userId,
              name: form.name.trim(),
              username: form.username.trim(),
            },
          ]);

        if (profileError) {
          alert("Error saving profile info");
          return;
        }
      }

      alert("Signup successful! Please verify your email.");
    }
  } catch (err) {
    console.error(err);
    alert("An unexpected error occurred. Please try again.");
  } finally {
    setLoading(false);
  }
};






  const handleChange = (field: keyof FormFields, value: string): void => {
    setForm((prev) => ({ ...prev, [field]: value }));

    // Clear error immediately when corrected
    const fieldError = validateField(field, value);
    setErrors((prev) => ({
      ...prev,
      [field]: fieldError,
    }));
  };

  const slideVariants: Variants = {
    initialRight: { x: "100%", opacity: 0, scale: 0.95 },
    initialLeft: { x: "-100%", opacity: 0, scale: 0.95 },
    animate: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
    },
    exitRight: {
      x: "100%",
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.5, ease: [0.42, 0, 1, 1] },
    },
    exitLeft: {
      x: "-100%",
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.5, ease: [0.42, 0, 1, 1] },
    },
  };

    const handleForgotPassword = async () => {
    if (!forgotEmail) {
      alert("Please enter your email.");
      return;
    }

    try {
      setForgotLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setForgotLoading(false);

      if (error) {
        alert(error.message);
        return;
      }

      setForgotSuccess(true);
    } catch (err) {
      console.error(err);
      setForgotLoading(false);
      alert("Unexpected error occurred.");
    }
  };
  return (
    <div
      className="flex flex-col z-10 gap-1 min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/landingbackground.svg')" }}
    >
      {/* Logo */}
      <div className="lg:pl-[15%] pl-[5%] pt-3">
        <Image src={Logo} alt="ClarityPulse Logo" width={120} height={50} className="w-20 lg:w-30" />
      </div>

      {/* Card */}
      <div className="flex items-center justify-center overflow-hidden">
        <div
          className="relative lg:w-[400px] w-[350px] mb-3 min-h-[600px] h-auto border-2 border-transparent rounded-3xl z-40 bg-cover bg-bottom-right bg-no-repeat lg:p-12 
         shadow-[0_10px_10px_-10px_rgba(10,61,98,0.6),0_15px_20px_-1px_rgba(10,61,98,0.45),0_40px_90px_-20px_rgba(10,61,98,0.35)]
flex flex-col items-center gap-4 overflow-hidden  transition-all duration-700 ease-in-out hover:shadow-[0_10px_20px_-5px_rgba(30,144,255,0.8),0_20px_40px_-10px_rgba(65,105,225,0.7)]"
          style={{ backgroundImage: "url('/landingbackground.svg')" }}
        >
       
          <AnimatePresence mode="wait">
            {account ? (
             
              <motion.form
                key="login"
                onSubmit={handleSubmit}
                variants={slideVariants}
                initial="initialLeft"
                animate="animate"
                exit="exitLeft"
                className="flex flex-col items-center gap-4 p-4 lg:p-0 w-full h-full "
              >
                <div className="rounded-[40%] bg-black flex items-center justify-center w-8 h-9 ">
                  <IoEnterOutline size={20} color="white" />
                </div>

                <div className="text-center">
                  <h3 className="text-black font-figtree font-bold text-[20px]">
                    Sign in with email
                  </h3>
                  <h4 className="bg-linear-to-r from-blue-500 via-[#0A3D62] to-pink-500 bg-clip-text text-transparent font-figtree font-bold text-[16px]">
                    Turn your raw website activity into actionable insights.
                  </h4>
                </div>

               
                <div className="w-full">
                  <div className="flex items-center pl-2 bg-gray-300 rounded-2xl h-12">
                    <IoMdMail size={17} color="black" />
                    <input
                      type="text"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="outline-none bg-transparent px-2 text-black placeholder-gray-400 font-figtree font-semibold w-full"
                      placeholder="Your Mail..."
                    />
                  </div>
                
                </div>

              
                <div className="w-full">
                  <div className="flex items-center pl-2 bg-gray-300 rounded-2xl h-12">
                    <FaLock size={17} color="black" />
                    <input
                   type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      className="outline-none bg-transparent px-2 text-black placeholder-gray-400 font-figtree font-semibold w-full"
                      placeholder="Your Password..."
                    />
                    <IoMdEye size={20} color="black" className="ml-auto mr-2 cursor-pointer"    onClick={() => setShowPassword((prev) => !prev)} />
                  </div>
                    {errors.name && (
                    <p className="text-red-500 text-[14px] mt-1">
                      {errors.name}
                    </p>
                  )}
                  <h4 className="text-black font-figtree font-semibold text-[15px] ml-auto mt-2 cursor-pointer"
                    onClick={() => setForgotModalOpen(true)}
                  >
                    Forgot Password?
                  </h4>
                </div>

                {/* Button */}
                <div className="mt-3 flex flex-col items-center">
                  <button
                    type="submit"
                    className="lg:w-80  w-50 h-12 cursor-pointer bg-black font-figtree font-semibold rounded-2xl text-white duration-500 ease-in-out hover:bg-white hover:text-black border-2 border-transparent hover:border-black flex items-center justify-center"
                    disabled={loading}
                  >
                    {loading ? <ClipLoader size={20} color="#fff" /> : "Login"}
                  </button>
                  <h4 className="text-black font-figtree font-semibold text-[15px] mt-2">
                    Don't have an account?{" "}
                    <span
                      className="bg-linear-to-r  from-blue-500 via-[#0A3D62] to-pink-500 bg-clip-text text-transparent font-bold cursor-pointer"
                      onClick={() => setAccount(false)}
                    >
                      Sign Up
                    </span>
                  </h4>
                </div>

                <div className="flex justify-center mt-3 gap-24 items-center">
                  <a   href="https://Wa.me/+2348167160663"
              target="_blank"
              rel="noreferrer"><IoLogoWhatsapp size={25} color="green" /></a>
                 <a  href="https://portfolio-zsi6.onrender.com/" target="_blank" rel="noopener noreferrer"> <BsGlobe size={20} color="black" /></a>
                   <a  href="http://www.linkedin.com/in/toluwalase-ogunsola-5a5719235" target="_blank" rel="noopener noreferrer" ><FaLinkedinIn size={20} color="blue" /></a>
                </div>
              </motion.form>
            ) : (
              // ✅ SIGNUP FORM
              <motion.form
                key="signup"
                onSubmit={handleSubmit}
                variants={slideVariants}
                initial="initialRight"
                animate="animate"
                exit="exitRight"
                className="flex flex-col items-center gap-4  w-full h-full 4 p-4 lg:p-0 "
              >
                <div className="rounded-[40%] bg-black flex items-center justify-center w-9 h-10">
                  <GrDocumentUser size={20} color="white" />
                </div>

                <div className="text-center">
                  <h3 className="text-black font-figtree font-bold text-[20px]">
                    Sign up with email
                  </h3>
                  <h4 className="bg-linear-to-r from-blue-500 via-violet-500 to-pink-500 bg-clip-text text-transparent font-figtree font-bold text-[16px]">
                    Turn raw website activity into actionable insights.
                  </h4>
                </div>

                {/* Name */}
                <div className="w-full">
                  <div className="flex items-center pl-2 bg-gray-300 rounded-2xl h-12">
                    <MdOutlineMan size={17} color="black" />
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      className="outline-none bg-transparent px-2 text-black placeholder-gray-400 font-figtree font-semibold w-full"
                      placeholder="Your Name..."
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-500 text-[14px] mt-1">
                      {errors.name}
                    </p>
                  )}
                </div>    
                <div className="w-full">
                  <div className="flex items-center pl-2 bg-gray-300 rounded-2xl h-12">
                    <ImCool2 size={17} color="black" />
                    <input
                      type="text"
                      value={form.username}
                      onChange={(e) => handleChange("username", e.target.value)}
                      className="outline-none bg-transparent px-2 text-black placeholder-gray-400 font-figtree font-semibold w-full"
                      placeholder="Your Username..."
                    />
                  </div>
                  {errors.username && (
                    <p className="text-red-500 text-[14px] mt-1">
                      {errors.username}
                    </p>
                  )}
                </div>
                <div className="w-full">
                  <div className="flex items-center pl-2 bg-gray-300 rounded-2xl h-12">
                    <IoMdMail size={17} color="black" />
                    <input
                      type="text"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="outline-none bg-transparent px-2 text-black placeholder-gray-400 font-figtree font-semibold w-full"
                      placeholder="Your Mail..."
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-[14px] mt-1">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="w-full">
                  <div className="flex items-center pl-2 bg-gray-300 rounded-2xl h-12">
                    <FaLock size={17} color="black" />
                    <input
                        type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      className="outline-none bg-transparent px-2 text-black placeholder-gray-400 font-figtree font-semibold w-full"
                      placeholder="Your Password..."
                    />
                    <IoMdEye size={20} color="black" className="ml-auto mr-2 curdor-pointer"    onClick={() => setShowPassword((prev) => !prev)}  />
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-[14px] mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="mt-3 flex flex-col items-center">
                  <button
                    type="submit"
                    className="lg:w-80  w-50 h-12 cursor-pointer bg-black font-figtree font-semibold rounded-2xl text-white duration-500 ease-in-out hover:bg-white hover:text-black border-2 border-transparent hover:border-black flex items-center justify-center"
                    disabled={loading}
                  >
                    {loading ? <ClipLoader size={20} color="#fff" /> : "Get Started"}
                  </button>
                  <h4 className="text-black font-figtree font-semibold text-[15px] mt-2">
                    Already have an Account?{" "}
                    <span
                      className="bg-linear-to-r from-blue-500 via-violet-500 to-pink-500 bg-clip-text text-transparent font-bold cursor-pointer"
                      onClick={() => setAccount(true)}
                    >
                      Login
                    </span>
                  </h4>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
         <Modal
        isOpen={forgotModalOpen}
        onRequestClose={() => { setForgotModalOpen(false); setForgotSuccess(false); }}
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
        ariaHideApp={false}
      >
        {!forgotSuccess ? (
          <>
            <h2 className="text-xl font-bold mb-4">Reset Password</h2>
            <p className="mb-2">Enter your email to receive a password reset link.</p>
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="border p-2 w-full rounded-xl bg-gray-300 mb-4 outline-none"
              placeholder="Your email"
            />
            <button
              className="bg-black text-white px-4 py-2 rounded-2xl w-full cursor-pointer flex justify-center"
              onClick={handleForgotPassword}
              disabled={forgotLoading}
            >
              {forgotLoading ? <PulseLoader size={8} color="#fff" /> : "Send"}
            </button>
          </>
        ) : (
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Email Sent!</h2>
            <p>Check your inbox for the password reset link.</p>
            <button
              className="mt-4 bg-black text-white px-4 py-2 rounded-2xl cursor-pointer"
              onClick={() => { setForgotModalOpen(false); setForgotSuccess(false); setForgotEmail(""); }}
            >
              Close
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
