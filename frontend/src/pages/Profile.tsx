
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

interface ProfileData {
  id: number;
  username: string;
  email: string;
  bio: string;
  followers: number;
  following: number;
  isFollowing: boolean;
}

function Profile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [editingBio, setEditingBio] = useState(false);
const [bioDraft, setBioDraft] = useState("");
const [savingBio, setSavingBio] = useState(false);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

const handleSaveBio = async () => {
  const token = localStorage.getItem("token");

  if (!token || !profile) {
    navigate("/login");
    return;
  }

  setSavingBio(true);
  setError("");

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bio: bioDraft }),
    });

    if (!response.ok) {
      throw new Error(`Could not update bio (${response.status})`);
    }

    const data = await response.json();

    setProfile({ ...profile, bio: data.bio });
    setEditingBio(false);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Could not update bio");
  } finally {
    setSavingBio(false);
  }
};

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      if (!username) {
        setError("Username not provided");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/users/${encodeURIComponent(username)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to load profile (${response.status})`);
        }

        const data: ProfileData = await response.json();
        setProfile(data);
        setError("");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load profile"
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, [username, navigate]);

  const handleFollow = async () => {
    if (!profile) return;

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    setFollowLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/${profile.id}/follow`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Follow failed (${response.status})`);
      }

      // Reload the profile so counts and follow status match the database.
      const profileResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/${encodeURIComponent(profile.username)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!profileResponse.ok) {
        throw new Error("Follow updated, but could not refresh profile");
      }

      const updatedProfile: ProfileData = await profileResponse.json();
      setProfile(updatedProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Follow action failed");
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <p className="error-message">{error || "Profile not found"}</p>
          <Link to="/">Back to Home</Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = localStorage.getItem("token") !== null &&
    profile.username === localStorage.getItem("username");

  return (
    <div className="profile-page">
      <div className="profile-card">
        <Link to="/" className="back-link">
          ← Back to Feed
        </Link>

        <div className="profile-avatar">
          {profile.username.charAt(0).toUpperCase()}
        </div>

        <h1>@{profile.username}</h1>
        {editingBio ? (
  <div>
    <textarea
      value={bioDraft}
      maxLength={160}
      onChange={(e) => setBioDraft(e.target.value)}
      placeholder="Write a short bio..."
    />
    <button onClick={handleSaveBio} disabled={savingBio}>
      {savingBio ? "Saving..." : "Save Bio"}
    </button>
    <button onClick={() => setEditingBio(false)}>
      Cancel
    </button>
  </div>
) : (
  <>
    <p className="profile-bio">{profile.bio || "No bio yet."}</p>
    <button
      onClick={() => {
        setBioDraft(profile.bio);
        setEditingBio(true);
      }}
    >
      Edit Bio
    </button>
  </>
)}

        <div className="profile-stats">
          <div>
            <strong>{profile.followers}</strong>
            <span>Followers</span>
          </div>
          <div>
            <strong>{profile.following}</strong>
            <span>Following</span>
          </div>
        </div>

        {!isOwnProfile && (
          <button
            className="follow-button"
            onClick={handleFollow}
            disabled={followLoading}
          >
            {followLoading
              ? "Please wait..."
              : profile.isFollowing
                ? "Unfollow"
                : "Follow"}
          </button>
        )}

        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}

export default Profile;