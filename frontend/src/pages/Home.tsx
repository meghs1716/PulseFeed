
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

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

interface SearchUser {
  id: number;
  username: string;
  bio: string;
}

type FeedMode = "latest" | "forYou";

function Home() {
  const navigate = useNavigate();

  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedTopic, setSelectedTopic] = useState("");
  const [feedMode, setFeedMode] = useState<FeedMode>("latest");

  const getToken = () => localStorage.getItem("token");

  // Load posts
  useEffect(() => {
    const loadPosts = async () => {
      const token = getToken();

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/posts`, {
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

        const data: Post[] = await response.json();
        setPosts(data);
        setError("");
      } catch (err) {
        console.error("Load posts error:", err);
        setError("Could not load posts. Please refresh and try again.");
      } finally {
        setLoading(false);
      }
    };

    void loadPosts();
  }, [navigate]);

  // Search users
  const handleSearch = async () => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/users/search?query=${encodeURIComponent(
          searchQuery.trim()
        )}`,
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
        throw new Error(`Search failed (${response.status})`);
      }

      const data: SearchUser[] = await response.json();
      setSearchResults(data);
      setHasSearched(true);
    } catch (err) {
      console.error("Search error:", err);
      setError("Could not search users.");
    }
  };

  // Create post
  const handleCreatePost = async () => {
    if (!content.trim()) return;

    if (content.length > 280) {
      setError("Post cannot exceed 280 characters.");
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
      const response = await fetch(`${API_BASE_URL}/api/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: content.trim() }),
      });

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to create post.");
      }

      setPosts((current) => [data, ...current]);
      setContent("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create post."
      );
    } finally {
      setPosting(false);
    }
  };

  // Like or unlike a post
  const handleLike = async (postId: number) => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/posts/${postId}/like`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to update like.");
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
      setError(
        err instanceof Error ? err.message : "Could not update like."
      );
    }
  };

  // Delete a post
  const handleDeletePost = async (postId: number) => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/posts/${postId}`,
        {
          method: "DELETE",
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
        throw new Error(`Could not delete post (${response.status}).`);
      }

      setPosts((current) =>
        current.filter((post) => post.id !== postId)
      );

      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete post."
      );
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    navigate("/login");
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleString();

  // Calculate trending hashtags from loaded posts
  const trendingTopics = (() => {
    const counts = new Map<string, number>();

    posts.forEach((post) => {
      const hashtags = post.content.match(/#[a-zA-Z0-9_]+/g) ?? [];
      const uniqueHashtags = new Set(
        hashtags.map((tag) => tag.toLowerCase())
      );

      uniqueHashtags.forEach((tag) => {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      });
    });

    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort(
        (a, b) =>
          b.count - a.count || a.tag.localeCompare(b.tag)
      )
      .slice(0, 5);
  })();

  // Filter posts by selected hashtag
  const visiblePosts = selectedTopic
    ? posts.filter((post) =>
        post.content.toLowerCase().includes(selectedTopic)
      )
    : posts;

  // Rank posts for the For You feed
  const rankedPosts = [...visiblePosts].sort((a, b) => {
    if (feedMode === "latest") {
      return (
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
      );
    }

    const score = (post: Post) => {
      const createdTime = new Date(post.createdAt).getTime();
      const ageHours = Number.isFinite(createdTime)
        ? Math.max(0, (Date.now() - createdTime) / 3600000)
        : 0;

      return (10 + 2 * (post.likeCount ?? 0)) / (1 + ageHours);
    };

    const scoreDifference = score(b) - score(a);

    // Use newest-first order when scores are equal
    if (scoreDifference === 0) {
      return (
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
      );
    }

    return scoreDifference;
  });

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
          <div className="sidebar-item" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>🏠 Home</div>
          <div
            className="sidebar-item"
            onClick={() => {
              document
                .querySelector(".right-sidebar")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            style={{ cursor: "pointer" }}
          >
            🔥 Trending
          </div>
          <div
            className="sidebar-item"
            onClick={() => {
              const currentUsername = localStorage.getItem("username");
              if (currentUsername) {
                navigate(`/profile/${encodeURIComponent(currentUsername)}`);
              }
            }}
            style={{ cursor: "pointer" }}
          >
            👤 Profile
          </div>
          <div className="sidebar-item">⚙️ Settings</div>
        </aside>

        <main className="feed">
          <div className="feed-header">
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
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHasSearched(false);
                  }}
                />

                <button type="submit">Search</button>
              </form>

              {searchResults.length > 0 && (
                <div className="user-search-results">
                  {searchResults.map((user) => (
                    <div
                      className="user-search-result"
                      key={user.id}
                    >
                      <Link
                        to={`/profile/${encodeURIComponent(
                          user.username
                        )}`}
                      >
                        @{user.username}
                      </Link>
                      <p>{user.bio || "No bio yet"}</p>
                    </div>
                  ))}
                </div>
              )}

              {hasSearched && searchResults.length === 0 && (
                <p style={{ color: "#aaa0ba", fontSize: 13 }}>
                  No matching users found.
                </p>
              )}
            </div>

            <div>
              <h2>
                {selectedTopic
                  ? `Trending: ${selectedTopic}`
                  : "Your Feed"}
              </h2>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginTop: 10,
                }}
              >
                <button
                  onClick={() => setFeedMode("latest")}
                  disabled={feedMode === "latest"}
                >
                  Latest
                </button>

                <button
                  onClick={() => setFeedMode("forYou")}
                  disabled={feedMode === "forYou"}
                >
                  For You
                </button>

                {selectedTopic && (
                  <button onClick={() => setSelectedTopic("")}>
                    All Posts
                  </button>
                )}
              </div>
            </div>
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
                onClick={() => void handleCreatePost()}
                disabled={posting || !content.trim()}
              >
                {posting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <div className="loading">Loading posts...</div>
          ) : rankedPosts.length === 0 ? (
            <div className="empty-feed">
              <h3>
                {selectedTopic ? "No posts for this topic" : "No posts yet"}
              </h3>
              <p>
                {selectedTopic
                  ? "Try another trending topic or view all posts."
                  : "Be the first person to post on PulseFeed."}
              </p>
            </div>
          ) : (
            <div className="posts-list">
              {rankedPosts.map((post) => (
                <article className="post-card" key={post.id}>
                  <div className="post-header">
                    <div className="avatar">
                      {post.user?.username
                        ?.charAt(0)
                        .toUpperCase() ?? "?"}
                    </div>

                    <div>
                      <Link
                        to={`/profile/${encodeURIComponent(
                          post.user?.username ?? ""
                        )}`}
                        style={{
                          color: "#bd99ff",
                          textDecoration: "none",
                          cursor: "pointer",
                        }}
                      >
                        @{post.user?.username ?? "Unknown"}
                      </Link>

                      <div className="post-time">
                        {formatDate(post.createdAt)}
                      </div>
                    </div>
                  </div>

                  <p className="post-content">{post.content}</p>

                  <div className="post-actions">
                    <button
                      onClick={() => void handleDeletePost(post.id)}
                      style={{ color: "#ff6b6b" }}
                    >
                      🗑 Delete
                    </button>

                    <button onClick={() => void handleLike(post.id)}>
                      {post.liked ? "❤️ Unlike" : "♡ Like"} (
                      {post.likeCount ?? 0})
                    </button>

                    <button disabled title="Comments are not implemented yet">
                      💬 Comment
                    </button>

                    <button disabled title="Sharing is not implemented yet">
                      ↗ Share
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>

        <aside className="sidebar right-sidebar">
          <h3>Trending</h3>

          {trendingTopics.length === 0 ? (
            <p style={{ color: "#aaa0ba", fontSize: 13 }}>
              No hashtags yet. Try posting #AI or #Programming!
            </p>
          ) : (
            trendingTopics.map((topic) => (
              <div className="trend-item" key={topic.tag}>
                <button
                  type="button"
                  onClick={() => setSelectedTopic(topic.tag)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#bd99ff",
                    cursor: "pointer",
                    padding: 0,
                    font: "inherit",
                    textAlign: "left",
                  }}
                >
                  {topic.tag}
                </button>

                <small>
                  {topic.count}{" "}
                  {topic.count === 1 ? "post" : "posts"}
                </small>
              </div>
            ))
          )}
        </aside>
      </div>
    </div>
  );
}

export default Home;
