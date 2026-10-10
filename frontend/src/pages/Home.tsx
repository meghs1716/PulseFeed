import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

interface Post {
  id: number;
  content: string;
  createdAt: string;
  user: {
    username: string;
    email: string;
  };
  liked?: boolean;
  likeCount?: number;
}

function Home() {
  const navigate = useNavigate();
const [searchQuery, setSearchQuery] = useState("");
const [searchResults, setSearchResults] = useState<
  { id: number; username: string; bio: string }[]
>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    const loadPosts = async () => {
      const token = getToken();

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch("http://localhost:8080/api/posts", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to load posts: ${response.status}`);
        }

        const data = await response.json();
        setPosts(data);
        setError("");
      } catch (err) {
        console.error("Load posts error:", err);
        setError("Could not load posts. Please refresh and try again.");
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [navigate]);
const handleSearch = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    navigate("/login");
    return;
  }

  if (!searchQuery.trim()) {
    setSearchResults([]);
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:8080/api/users/search?query=${encodeURIComponent(searchQuery.trim())}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Search failed (${response.status})`);
    }

    setSearchResults(await response.json());
  } catch (err) {
    console.error("Search error:", err);
    setError("Could not search users");
  }
};
  const handleCreatePost = async () => {
    if (!content.trim()) return;

    if (content.length > 280) {
      setError("Post cannot exceed 280 characters");
      return;
    }

    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    setPosting(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8080/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: content.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create post");
      }

      setPosts((current) => [data, ...current]);
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: number) => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/posts/${postId}/like`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to like post");
      }

      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? {
                ...post,
                liked: data.liked,
                likeCount: data.likeCount,
              }
            : post
        )
      );
      setError("");
    } catch (err) {
      console.error("Like error:", err);
      setError("Could not update like");
    }
  };

const handleDeletePost = async (postId: number) => {
  const token = localStorage.getItem("token");

  if (!token) {
    navigate("/login");
    return;
  }

  if (!window.confirm("Are you sure you want to delete this post?")) {
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:8080/api/posts/${postId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Could not delete post (${response.status})`);
    }

    setPosts((currentPosts) =>
      currentPosts.filter((post) => post.id !== postId)
    );

    setError("");
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Could not delete post"
    );
  }
};
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const formatDate = (date: string) => new Date(date).toLocaleString();

  return (
    <div className="home-page">
      <nav className="navbar">
        <div className="logo">PulseFeed</div>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </nav>

      <div className="home-layout">
        <aside className="sidebar left-sidebar">
          <h3>Menu</h3>
          <div className="sidebar-item">🏠 Home</div>
          <div className="sidebar-item">🔥 Trending</div>
          <div className="sidebar-item">👤 Profile</div>
          <div className="sidebar-item">⚙️ Settings</div>
        </aside>

        <main className="feed">
          < div className="feed-header">
<div className="user-search">
  <form
    className="user-search-form"
    onSubmit={(e) => {
      e.preventDefault();
      void handleSearch();
    }}
  >
    <input
      type="text"
      placeholder="Search people by username..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
    <button type="submit">Search</button>
  </form>

  {searchResults.length > 0 && (
    <div className="user-search-results">
      {searchResults.map((user) => (
        <div className="user-search-result" key={user.id}>
          <Link to={`/profile/${encodeURIComponent(user.username)}`}>
            @{user.username}
          </Link>
          <p>{user.bio || "No bio yet"}</p>
        </div>
      ))}
    </div>
  )}

  {searchQuery.trim() && searchResults.length === 0 && (
    <p style={{ color: "#aaa0ba", fontSize: 13 }}>
      No matching users found.
    </p>
  )}
</div>


            <h2>Your Feed</h2>
          </div>

          <div className="create-post">
            <textarea
              placeholder="What's happening?"
              value={content}
              maxLength={280}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="create-post-footer">
              <span>{content.length}/280</span>
              <button
                onClick={handleCreatePost}
                disabled={posting || !content.trim()}
              >
                {posting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <div className="loading">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="empty-feed">
              <h3>No posts yet</h3>
              <p>Be the first person to post on PulseFeed.</p>
            </div>
          ) : (
            <div className="posts-list">
              {posts.map((post) => (
                <article className="post-card" key={post.id}>
                  <div className="post-header">
                    <div className="avatar">
                      {post.user.username.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <Link
                        to={`/profile/${encodeURIComponent(post.user.username)}`}
                        style={{
                          color: "#bd99ff",
                          textDecoration: "none",
                          cursor: "pointer",
                        }}
                      >
                        @{post.user.username}
                      </Link>

                      <div className="post-time">
                        {formatDate(post.createdAt)}
                      </div>
                    </div>
                  </div>

                  <p className="post-content">{post.content}</p>

                  <div className="post-actions">
                    <button
  onClick={() => handleDeletePost(post.id)}
  style={{ color: "#ff6b6b" }}
>
  🗑 Delete
</button>
                    <button onClick={() => handleLike(post.id)}>
                      {post.liked ? "❤️ Unlike" : "♡ Like"} (
                      {post.likeCount ?? 0})
                    </button>
                    <button>💬 Comment</button>
                    <button>↗ Share</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>

        <aside className="sidebar right-sidebar">
          <h3>Trending</h3>
          <div className="trend-item">
            <span>#Technology</span>
            <small>12.4K posts</small>
          </div>
          <div className="trend-item">
            <span>#AI</span>
            <small>9.8K posts</small>
          </div>
          <div className="trend-item">
            <span>#Programming</span>
            <small>7.2K posts</small>
          </div>
          <div className="trend-item">
            <span>#WebDevelopment</span>
            <small>5.9K posts</small>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Home;