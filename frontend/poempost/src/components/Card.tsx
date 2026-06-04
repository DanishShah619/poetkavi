"use client"

import { useEffect, useState } from "react"
import { Edit } from "lucide-react"
import { cn } from "@/lib/utils"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { useAuth } from "@/context/AuthContext"
import Image from "next/image"

interface UserProfile {
  username?: string;
  bio?: string;
  profilePic?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export function CardDemo() {
  const { currentUser: user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState("")
  const [bio, setBio] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return

    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", user.uid)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          setProfile(docSnap.data())
        } else {
          setProfile(null)
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      }
    }

    fetchProfile()
  }, [user])

  const getGeneratedAvatar = () =>
    `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.uid}`

  const handleEdit = () => {
    if (!user) return

    if (!profile) {
      setEditing(true)
      setUsername(user.email?.split("@")[0] || "")
    } else {
      setEditing(true)
      setUsername(profile.username || "")
      setBio(profile.bio || "")
    }
  }

  const handleSave = async () => {
    if (!user) return

    setLoading(true)

    try {
      const generatedAvatar = getGeneratedAvatar()

      const newProfile = {
        username,
        bio,
        profilePic: profile?.profilePic || generatedAvatar,
        createdAt: profile?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      await setDoc(doc(db, "users", user.uid), newProfile)
      setProfile(newProfile)
      setEditing(false)
      console.log("Profile saved!")
    } catch (error) {
      console.error("Error saving profile:", error)
      alert("Error saving profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    if (profile) {
      setUsername(profile.username || "")
      setBio(profile.bio || "")
    } else {
      setUsername("")
      setBio("")
    }
  }

  return (
    <div className="max-w-xs w-full group/card relative">
      {/* 🖊️ Card UI */}
      <div
        className={cn(
          "cursor-pointer overflow-hidden relative card h-96 rounded-md shadow-xl max-w-sm mx-auto backgroundImage flex flex-col justify-between p-4",
          "bg-[url(https://images.unsplash.com/photo-1544077960-604201fe74bc?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1651&q=80)] bg-cover"
        )}
      >
        {/* Hover Overlay */}
        <div className="absolute w-full h-full top-0 left-0 transition duration-300 group-hover/card:bg-black opacity-60"></div>

        {/* Edit Button */}
        <div className="absolute top-2 right-2 z-20">
          <button
            onClick={handleEdit}
            className="p-1 rounded hover:bg-white/10 transition-all duration-200 group/edit"
            disabled={loading}
          >
            <Edit className="w-3 h-3 text-white/70 hover:text-white" />
          </button>
        </div>

        {/* Author Info */}
        <div className="flex flex-row items-center space-x-4 z-10">
          <Image
            height={100}
            width={100}
            alt="Avatar"
            src={user?.photoURL || getGeneratedAvatar()}
            className="h-10 w-10 rounded-full border-2 object-cover"
          />
          <div className="flex flex-col">
            <p className="font-normal text-base text-gray-50 relative z-10">
              @{profile?.username || "UserName"}
            </p>
            <p className="text-sm text-gray-400">2 min read</p>
          </div>
        </div>

        {/* Content */}
        <div className="text content">
          <h1 className="font-bold text-xl md:text-2xl text-gray-50 relative z-10">
            Author Card
          </h1>
          <p className="font-normal text-sm text-gray-50 relative z-10 my-4">
            {profile?.bio || "Card with Author avatar, complete name and time to read - most suitable for blogs."}
          </p>
        </div>
      </div>

      {/* 📝 Edit Form Popup */}
      {editing && (
        <div className="absolute top-0 left-0 w-full h-full bg-black/80 flex flex-col justify-center items-center p-4 z-50">
          <div className="bg-white rounded-md p-4 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-semibold">
              {profile ? "Edit Profile" : "Complete Your Profile"}
            </h2>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <textarea
                placeholder="Tell us about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="flex justify-between gap-2">
              <button
                onClick={handleCancel}
                className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors disabled:opacity-50"
                disabled={loading || !username.trim()}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
