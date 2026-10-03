import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from 'react-router-dom';
const DEFAULT_AVATAR = "/default_48x48.png";
import { apiFetch } from "../utils/apiFetch";
import { getAuthUser, clearAuth } from "../utils/auth";

interface UserStats {
  games_played: number;
  wins: number;
  losses: number;
  win_rate: number;
}

interface ProgressionInfo {
  total_xp: number;
  level: number;
  current_level_xp: number;
  xp_per_level: number;
  progress_percent: number;
  rank_title: string;
}

interface UserBadge {
  id: string;
  name: string;
  description: string;
  type: 'trophy' | 'friend' | 'shield' | 'target';
  unlocked: boolean;
  unlocked_at?: string;
  progress: number;
  target: number;
  progress_pct: number;
}

interface UserProfile {
  username: string;
  email?: string;
  bio: string;
  avatarUrl: string | null;
  stats?: UserStats;
  progression?: ProgressionInfo;
  badges?: UserBadge[];
}

interface MatchItem {
  id: number;
  opponent_id: number;
  opponent: string;
  opponent_avatar_url: string | null;
  user_score: number | null;
  opponent_score: number | null;
  status: string;
  result: string | null;
  outcome: 'win' | 'loss' | 'aborted' | null;
  started_at: string;
  finished_at: string | null;
}

interface ProfileComment {
  id: number;
  owner_id?: number;
  poster_id?: number;
  poster_username: string;
  poster_avatar_url: string | null;
  content: string;
  created_at: string;
}

function getRankTitle(level: number): string {
  if (level <= 1) return 'Rookie';
  if (level <= 3) return 'Contender';
  if (level <= 5) return 'Veteran';
  return 'Grandmaster';
}

const DEFAULT_BADGE_CATALOG: Omit<UserBadge, 'unlocked' | 'progress' | 'progress_pct'>[] = [
  {
    id: "first_friend",
    name: "Wingman",
    description: "Add your first friend",
    type: "friend",
    target: 1,
  },
  {
    id: "first_win",
    name: "First Blood",
    description: "Win your first game",
    type: "trophy",
    target: 1,
  },
  {
    id: "dominator",
    name: "Dominator",
    description: "Achieve 3 wins",
    type: "trophy",
    target: 3,
  },
  {
    id: "champion",
    name: "Champion",
    description: "Achieve 5 wins",
    type: "trophy",
    target: 5,
  },
  {
    id: "legend",
    name: "Legend",
    description: "Achieve 10 wins",
    type: "trophy",
    target: 10,
  },
  {
    id: "veteran",
    name: "Arena Veteran",
    description: "Play at least 5 matches",
    type: "shield",
    target: 5,
  },
  {
    id: "gladiator",
    name: "Gladiator",
    description: "Play at least 10 matches",
    type: "shield",
    target: 10,
  },
  {
    id: "warlord",
    name: "Warlord",
    description: "Play at least 20 matches",
    type: "shield",
    target: 20,
  },
];

function formatMatchDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();

  const authUser = getAuthUser();

  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [initialUserData, setInitialUserData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // check if current user is viewing their own profile wall
  const isOwnProfile = !username || Boolean(authUser && userData?.username && authUser.username.toLowerCase() === userData.username.toLowerCase());

  // determine if current user has permission to delete a comment
  const canDeleteComment = (comment: ProfileComment): boolean => {
    if (!authUser) return false;
    // wall owner can delete any comment on their profile
    if (isOwnProfile) return true;
    // on other profiles, users can only delete their own comments
    if (comment.poster_id && authUser.userId === comment.poster_id) return true;
    if (comment.poster_username && authUser.username.toLowerCase() === comment.poster_username.toLowerCase()) return true;
    return false;
  };

  // player search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);

  // matches and friends state
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [hasMoreMatches, setHasMoreMatches] = useState(false);
  const [isLoadingMoreMatches, setIsLoadingMoreMatches] = useState(false);
  const [hasFriends, setHasFriends] = useState(false);

  // comments section state
  const [comments, setComments] = useState<ProfileComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [isLoadingMoreComments, setIsLoadingMoreComments] = useState(false);

  // state for view and edit modes
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [editGeneralError, setEditGeneralError] = useState<string | null>(null);

  // state for friend request actions on other player profiles
  const [friendshipState, setFriendshipState] = useState<{
    status: 'none' | 'pending' | 'accepted' | 'blocked';
    isIncoming?: boolean;
    friendshipId?: number;
  }>({ status: 'none' });
  const [isFriendActionLoading, setIsFriendActionLoading] = useState(false);
  const [friendActionError, setFriendActionError] = useState<string | null>(null);

  // state for account deletion modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await apiFetch('/api/protected/profile', {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "Failed to delete account");
        throw new Error(errText || "Failed to delete account");
      }
      clearAuth();
      window.location.href = "/";
    } catch (err: any) {
      console.error("Account deletion failed:", err);
      setDeleteError(err.message || "An unexpected error occurred while deleting your account.");
      setIsDeleting(false);
    }
  };

  const confirmInputRef = useRef<HTMLInputElement>(null);

  // handle keyboard navigation (Enter to accept/proceed, Escape to cancel) in delete modal
  useEffect(() => {
    if (!isDeleteModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!isDeleting) {
          setIsDeleteModalOpen(false);
          setDeleteStep(1);
          setDeleteConfirmText("");
          setDeleteError(null);
        }
      } else if (e.key === "Enter") {
        if (deleteStep === 1) {
          e.preventDefault();
          setDeleteStep(2);
        } else if (deleteStep === 2) {
          const isConfirmed =
            deleteConfirmText.trim() === "DELETE" ||
            Boolean(userData && deleteConfirmText.trim() === userData.username);
          if (isConfirmed && !isDeleting) {
            e.preventDefault();
            handleDeleteAccount();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDeleteModalOpen, deleteStep, deleteConfirmText, isDeleting, userData]);

  useEffect(() => {
    if (isDeleteModalOpen && deleteStep === 2) {
      setTimeout(() => {
        confirmInputRef.current?.focus();
      }, 50);
    }
  }, [isDeleteModalOpen, deleteStep]);

  // clean up blob preview url to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // reset edit state when profile/user changes
  useEffect(() => {
    setIsEditing(false);
    setAvatarFile(null);
    setBioError(null);
    setEmailError(null);
    setEditGeneralError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [username]);

  // ensure edit mode cannot stay active on someone else's profile
  useEffect(() => {
    if (!isOwnProfile && isEditing) {
      setIsEditing(false);
      setAvatarFile(null);
      setBioError(null);
      setEmailError(null);
      setEditGeneralError(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  }, [isOwnProfile, isEditing, previewUrl]);

  // fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const endpoint = username ? `/api/protected/profile/${username}` : `/api/protected/profile`;
        const response = await apiFetch(endpoint);

        if (response.ok) {
          const data = await response.json();
          setUserData(data);
          setInitialUserData(data);
        } else {
          console.error("Failed to fetch profile data, status:", response.status);
          setUserData(null);
        }
      } catch (error) {
        console.error("Network error during profile fetch:", error);
        setUserData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  // fetch match history and friends status
  useEffect(() => {
    const fetchMatches = async () => {
      setIsLoadingMatches(true);
      try {
        const queryParams = new URLSearchParams();
        if (username) queryParams.set("username", username);
        queryParams.set("limit", "10");
        queryParams.set("offset", "0");

        const response = await apiFetch(`/api/protected/matches?${queryParams.toString()}`);
        if (response.ok) {
          const data = await response.json();
          const list = Array.isArray(data) ? data : [];
          setMatches(list);
          setHasMoreMatches(list.length === 10);
        } else {
          setMatches([]);
          setHasMoreMatches(false);
        }
      } catch (error) {
        console.error("Failed to fetch matches:", error);
        setMatches([]);
        setHasMoreMatches(false);
      } finally {
        setIsLoadingMatches(false);
      }
    };

    const fetchFriendsStatus = async () => {
      try {
        const response = await apiFetch('/api/protected/friends');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setHasFriends(true);
          }
        }
      } catch (error) {
        console.error("Failed to check friends status:", error);
      }
    };

    fetchMatches();
    if (!username) {
      fetchFriendsStatus();
    }
  }, [username]);

  // check friendship status with the viewed player if not own profile
  useEffect(() => {
    if (isOwnProfile || !userData?.username || !authUser) {
      setFriendshipState({ status: 'none' });
      setFriendActionError(null);
      return;
    }

    const checkFriendship = async () => {
      try {
        const res = await apiFetch('/api/protected/friends');
        if (res.ok) {
          const friendsList = await res.json();
          if (Array.isArray(friendsList)) {
            const match = friendsList.find(
              (f: any) => f.username === userData.username
            );
            if (match) {
              setFriendshipState({
                status: match.status,
                isIncoming: match.is_incoming,
                friendshipId: match.friendship_id,
              });
              return;
            }
          }
        }
        setFriendshipState({ status: 'none' });
      } catch (err) {
        console.error("Failed to check friendship status:", err);
      }
    };

    checkFriendship();
  }, [username, userData?.username, isOwnProfile, authUser?.userId]);

  // fetch comments for the displayed profile
  useEffect(() => {
    const profileUsername = username || userData?.username;
    if (!profileUsername) return;

    const fetchComments = async () => {
      setIsLoadingComments(true);
      try {
        const response = await apiFetch(`/api/protected/profile/${profileUsername}/comments?limit=10`);
        if (response.ok) {
          const data = await response.json();
          setComments(Array.isArray(data.comments) ? data.comments : []);
          setHasMoreComments(Boolean(data.has_more));
        } else {
          setComments([]);
          setHasMoreComments(false);
        }
      } catch (error) {
        console.error("Failed to fetch comments:", error);
        setComments([]);
        setHasMoreComments(false);
      } finally {
        setIsLoadingComments(false);
      }
    };

    fetchComments();
  }, [username, userData?.username]);

  // handle text input changes
  const handleInputChange = (field: keyof UserProfile, value: string) => {
    if (userData) {
      setUserData({ ...userData, [field]: value });

      if (field === 'bio') {
        if (value.length > 500) {
          setBioError("Bio cannot exceed 500 characters");
        } else {
          setBioError(null);
        }
      }

      if (field === 'email') {
        const trimmedEmail = value.trim();
        if (!trimmedEmail) {
          setEmailError("Email address is required");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
          setEmailError("Please enter a valid email address");
        } else if (trimmedEmail.length > 255) {
          setEmailError("Email cannot exceed 255 characters");
        } else {
          setEmailError(null);
        }
      }
    }
  };

  // handle searching for other players
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchError("Please enter a username to search.");
      return;
    }
    if (trimmed.length < 3) {
      setSearchError("Username must be at least 3 characters.");
      return;
    }
    if (trimmed.length > 50) {
      setSearchError("Username cannot exceed 50 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      setSearchError("Only letters, numbers, _ and - are allowed.");
      return;
    }
    setSearchError(null);
    navigate(`/profile/${trimmed}`);
    setSearchQuery("");
  };

  // handle posting a comment to backend
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const profileUsername = username || userData?.username;
    const trimmed = newCommentText.trim();
    if (!trimmed || !profileUsername || isPostingComment || trimmed.length > 1000) return;

    setIsPostingComment(true);
    setCommentError(null);
    try {
      const response = await apiFetch(`/api/protected/profile/${profileUsername}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: trimmed }),
      });

      if (response.ok) {
        const createdComment: ProfileComment = await response.json();
        setComments((prev) => [createdComment, ...prev]);
        setNewCommentText("");
      } else {
        const errText = await response.text();
        setCommentError(errText || "Failed to post comment");
      }
    } catch (error) {
      console.error("network error posting comment:", error);
      setCommentError("Network error while posting comment");
    } finally {
      setIsPostingComment(false);
    }
  };

  // handle deleting a comment via backend API
  const handleDeleteComment = async (commentId: number) => {
    const profileUsername = username || userData?.username;
    if (!profileUsername) return;

    try {
      const response = await apiFetch(`/api/protected/profile/${profileUsername}/comments/${commentId}`, {
        method: "DELETE",
      });

      if (response.ok || response.status === 204) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        console.error("failed to delete comment, status:", response.status);
      }
    } catch (error) {
      console.error("network error deleting comment:", error);
    }
  };

  // handle loading older matches with offset pagination
  const handleLoadMoreMatches = async () => {
    if (matches.length === 0 || isLoadingMoreMatches) return;

    setIsLoadingMoreMatches(true);
    try {
      const queryParams = new URLSearchParams();
      if (username) queryParams.set("username", username);
      queryParams.set("limit", "10");
      queryParams.set("offset", matches.length.toString());

      const response = await apiFetch(`/api/protected/matches?${queryParams.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : [];
        setMatches((prev) => [...prev, ...list]);
        setHasMoreMatches(list.length === 10);
      } else {
        setHasMoreMatches(false);
      }
    } catch (error) {
      console.error("Failed to load more matches:", error);
      setHasMoreMatches(false);
    } finally {
      setIsLoadingMoreMatches(false);
    }
  };

  // handle loading older comments with cursor pagination
  const handleLoadMoreComments = async () => {
    const profileUsername = username || userData?.username;
    if (!profileUsername || comments.length === 0 || isLoadingMoreComments) return;

    const lastId = comments[comments.length - 1].id;
    setIsLoadingMoreComments(true);
    try {
      const response = await apiFetch(`/api/protected/profile/${profileUsername}/comments?limit=10&last_shown_id=${lastId}`);
      if (response.ok) {
        const data = await response.json();
        setComments((prev) => [...prev, ...(data.comments || [])]);
        setHasMoreComments(Boolean(data.has_more));
      }
    } catch (error) {
      console.error("failed to load more comments:", error);
    } finally {
      setIsLoadingMoreComments(false);
    }
  };

  // save profile updates
  const handleSave = async () => {
    if (!userData || !isOwnProfile) {
      return;
    }

    // validate bio and email before sending
    if (userData.bio && userData.bio.length > 500) {
      setBioError("Bio cannot exceed 500 characters");
      return;
    }
    const trimmedEmail = (userData.email || "").trim();
    if (!trimmedEmail) {
      setEmailError("Email address is required");
      return;
    }
    if (trimmedEmail.length > 255) {
      setEmailError("Email cannot exceed 255 characters");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setEditGeneralError(null);
    setIsSaving(true);
    try {
      let currentData = userData;

      // if user selected a new avatar, upload it to the avatar endpoint
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);

        const avatarResponse = await apiFetch('/api/protected/avatar', {
          method: 'POST',
          body: formData,
        });

        if (!avatarResponse.ok) {
          const errorMsg = await avatarResponse.text();
          console.error("failed to upload avatar, status:", avatarResponse.status, errorMsg);
          setEditGeneralError(`Failed to upload avatar: ${errorMsg || "unsupported format (use PNG, JPEG, or GIF)"}`);
          return;
        }

        const updatedWithAvatar = await avatarResponse.json();
        currentData = {
          ...currentData,
          ...updatedWithAvatar,
          stats: userData.stats,
          progression: userData.progression,
          badges: userData.badges,
          email: userData.email,
          bio: userData.bio,
        };
        setUserData(currentData);
        setAvatarFile(null);
        setPreviewUrl(null);
      }

      // dirty check: only send patch if text fields changed
      const hasTextChanges = Boolean(
        initialUserData &&
        (currentData.email !== initialUserData.email || currentData.bio !== initialUserData.bio)
      );

      if (hasTextChanges) {
        const payload = {
          email: currentData.email,
          bio: currentData.bio,
        };

        const response = await apiFetch('/api/protected/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const updated = await response.json();
          currentData = {
            ...currentData,
            ...updated,
            stats: userData.stats,
            progression: userData.progression,
            badges: userData.badges,
          };
          setUserData(currentData);
        } else {
          const errText = await response.text();
          console.error("Failed to update profile, status:", response.status, errText);
          setEditGeneralError(errText || "Failed to update profile");
          return;
        }
      }

      setInitialUserData(currentData);
      setBioError(null);
      setEmailError(null);
      setEditGeneralError(null);
      setIsEditing(false);
    } catch (error) {
      console.error("Network error during profile update:", error);
      setEditGeneralError("Network error during profile update");
    } finally {
      setIsSaving(false);
    }
  };

  // send friend request to the currently viewed player
  const handleSendFriendRequest = async () => {
    if (!userData?.username || isFriendActionLoading) return;
    setIsFriendActionLoading(true);
    setFriendActionError(null);

    try {
      const res = await apiFetch('/api/protected/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target: userData.username }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || 'Failed to send friend request');
      }

      const data = await res.json();
      setFriendshipState({
        status: data.status || 'pending',
        isIncoming: false,
        friendshipId: data.id,
      });
    } catch (err: any) {
      console.error('Error sending friend request:', err);
      setFriendActionError(err.message || 'Failed to send friend request');
    } finally {
      setIsFriendActionLoading(false);
    }
  };

  // accept pending incoming friend request from the currently viewed player
  const handleAcceptFriendRequest = async () => {
    if (!friendshipState.friendshipId || isFriendActionLoading) return;
    setIsFriendActionLoading(true);
    setFriendActionError(null);

    try {
      const res = await apiFetch(`/api/protected/friends/${friendshipState.friendshipId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'accepted' }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || 'Failed to accept friend request');
      }

      setFriendshipState((prev) => ({
        ...prev,
        status: 'accepted',
      }));
    } catch (err: any) {
      console.error('Error accepting friend request:', err);
      setFriendActionError(err.message || 'Failed to accept friend request');
    } finally {
      setIsFriendActionLoading(false);
    }
  };

  const stats = userData?.stats || {
    games_played: 0,
    wins: 0,
    losses: 0,
    win_rate: 0,
  };

  // progression details from backend API (with safe fallback if missing)
  const fallbackTotalXp = (stats.wins * 100) + (stats.losses * 35);
  const fallbackXpPerLevel = 200;
  const fallbackLevel = Math.floor(fallbackTotalXp / fallbackXpPerLevel) + 1;
  const fallbackCurrentLevelXp = fallbackTotalXp % fallbackXpPerLevel;
  const fallbackProgressPercent = Math.min(100, Math.floor((fallbackCurrentLevelXp / fallbackXpPerLevel) * 100));

  const progression: ProgressionInfo = userData?.progression || {
    total_xp: fallbackTotalXp,
    level: fallbackLevel,
    current_level_xp: fallbackCurrentLevelXp,
    xp_per_level: fallbackXpPerLevel,
    progress_percent: fallbackProgressPercent,
    rank_title: getRankTitle(fallbackLevel),
  };

  const currentLevel = progression.level;
  const currentLevelXp = progression.current_level_xp;
  const xpPerLevel = progression.xp_per_level;
  const progressPercent = progression.progress_percent;
  const rankTitle = progression.rank_title;

  // derive badges: use backend-provided badges if available, or compute from catalog with live stats as fallback
  const badges: UserBadge[] = userData?.badges && userData.badges.length > 0
    ? userData.badges
    : DEFAULT_BADGE_CATALOG.map((b) => {
        let current = 0;
        if (b.type === 'friend') {
          current = hasFriends ? 1 : 0;
        } else if (b.id === 'first_win' || b.id === 'dominator' || b.id === 'champion' || b.id === 'legend') {
          current = stats.wins;
        } else if (b.id === 'veteran' || b.id === 'gladiator' || b.id === 'warlord') {
          current = stats.games_played;
        }
        const progress = Math.max(0, Math.min(current, b.target));
        const progress_pct = b.target > 0 ? Math.round((progress / b.target) * 100) : 0;
        const unlocked = current >= b.target;
        return {
          ...b,
          progress,
          progress_pct,
          unlocked,
        };
      });

  if (isLoading) {
    return (
      <div className="p-8 bg-zinc-900 text-zinc-400 font-bold uppercase tracking-widest min-h-screen text-center">
        Loading profile...
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="p-8 bg-zinc-900 text-white min-h-screen font-sans">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-zinc-800 border-4 border-black p-4 shadow-[4px_4px_0_0_#000000]">
            <Link
              to="/profile"
              className="bg-zinc-700 hover:bg-zinc-600 text-white border-2 border-black px-3 py-1.5 text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0_0_#000000] transition-all w-auto inline-block text-center"
            >
              ← Back to My Profile
            </Link>
            <div className="flex flex-col sm:items-end gap-1">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={50}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (searchError) setSearchError(null);
                  }}
                  placeholder="SEARCH PLAYER USERNAME..."
                  className={`bg-zinc-900 border-2 ${searchError ? "border-rose-500" : "border-black"} px-3 py-1.5 outline-none focus:border-lime-500 text-white tracking-wider text-xs font-bold`}
                />
                <button
                  type="submit"
                  disabled={!searchQuery.trim()}
                  className="bg-lime-600 hover:bg-lime-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black uppercase tracking-wider px-4 py-1.5 border-2 border-black shadow-[2px_2px_0_0_#000000] text-xs"
                >
                  Search
                </button>
              </form>
              {searchError && (
                <span className="text-[11px] text-rose-400 font-bold tracking-wider">
                  {searchError}
                </span>
              )}
            </div>
          </div>
          <div className="p-8 bg-zinc-800 border-4 border-black text-red-400 font-bold uppercase tracking-widest text-center shadow-[6px_6px_0_0_#000000]">
            Player profile not found.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-zinc-900 text-white min-h-screen font-sans">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Player Search Bar Dock */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-zinc-800 border-4 border-black p-4 shadow-[4px_4px_0_0_#000000]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Player Directory
            </span>
            {username && (
              <Link
                to="/profile"
                className="ml-2 bg-zinc-700 hover:bg-zinc-600 text-white border-2 border-black px-2.5 py-1 text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0_0_#000000] transition-all"
              >
                ← My Profile
              </Link>
            )}
          </div>

          <div className="flex flex-col sm:items-end gap-1 w-full sm:w-auto">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                maxLength={50}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (searchError) setSearchError(null);
                }}
                placeholder="SEARCH PLAYER..."
                className={`bg-zinc-900 border-2 ${searchError ? "border-rose-500" : "border-black"} px-3 py-1.5 outline-none focus:border-lime-500 text-white tracking-wider text-xs font-bold w-full sm:w-64`}
              />
              <button
                type="submit"
                disabled={!searchQuery.trim()}
                className="bg-lime-600 hover:bg-lime-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black uppercase tracking-wider px-4 py-1.5 border-2 border-black shadow-[2px_2px_0_0_#000000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all text-xs shrink-0"
              >
                Search
              </button>
            </form>
            {searchError && (
              <span className="text-[11px] text-rose-400 font-bold tracking-wider">
                {searchError}
              </span>
            )}
          </div>
        </div>

        {/* Top Hero Card (Avatar, Info, Progress, and Combat Stats) */}
        {isEditing && isOwnProfile ? (
          /* Editing form inside hero banner */
          <div className="bg-zinc-800 border-4 border-black p-6 shadow-[6px_6px_0_0_#000000]">
            <h2 className="text-xl font-black uppercase tracking-wider text-zinc-100 mb-6">
              Edit Your Profile
            </h2>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar preview and file picker */}
              <div className="flex flex-col items-center sm:items-start gap-3 shrink-0">
                <img
                  src={previewUrl || userData.avatarUrl || DEFAULT_AVATAR}
                  alt={`${userData.username} preview`}
                  className="w-36 h-36 md:w-44 md:h-44 border-4 border-black shadow-[4px_4px_0_0_#000000] bg-zinc-900 object-cover"
                />
                <label
                  htmlFor="avatar-upload"
                  className="cursor-pointer bg-zinc-700 text-white font-bold uppercase tracking-widest px-4 py-2 border-2 border-black shadow-[2px_2px_0_0_#000000] hover:bg-zinc-600 active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all text-xs text-center w-full"
                >
                  {avatarFile ? avatarFile.name : "Change Avatar"}
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/png, image/jpeg, image/gif"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const allowedTypes = ['image/png', 'image/jpeg', 'image/gif'];
                      if (!allowedTypes.includes(file.type)) {
                        alert("unsupported file format (please choose PNG, JPEG, or GIF)");
                        return;
                      }
                      if (file.size > 2 * 1024 * 1024) {
                        alert("image too large (max 2mb)");
                        return;
                      }
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                      }
                      setAvatarFile(file);
                      setPreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                  className="hidden"
                />
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-center">
                  PNG, JPEG, GIF • Max 2 MB
                </p>
              </div>

              {/* Form text fields */}
              <div className="flex-1 min-w-0 flex flex-col gap-4">
                {editGeneralError && (
                  <div className="p-3 bg-rose-950/80 border-2 border-rose-600 text-rose-300 text-xs font-bold uppercase tracking-wider">
                    {editGeneralError}
                  </div>
                )}

                <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-300">
                  Email:
                  <input
                    type="email"
                    maxLength={255}
                    value={userData.email || ""}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`bg-zinc-900 border-4 ${emailError ? "border-rose-500" : "border-black"} p-2 outline-none focus:border-lime-500 transition-colors text-white tracking-wider text-sm font-bold w-full`}
                  />
                  {emailError && (
                    <span className="text-[10px] text-rose-400 font-bold tracking-wider mt-0.5">
                      {emailError}
                    </span>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-300">
                  Bio:
                  <textarea
                    maxLength={500}
                    value={userData.bio || ""}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={4}
                    className={`bg-zinc-900 border-4 ${bioError ? "border-rose-500" : "border-black"} p-2 outline-none focus:border-lime-500 transition-colors text-white tracking-wider text-sm font-bold resize-none w-full break-words [overflow-wrap:anywhere]`}
                  />
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider mt-0.5">
                    {bioError ? (
                      <span className="text-rose-400">{bioError}</span>
                    ) : (
                      <span className="text-zinc-500">Maximum 500 characters</span>
                    )}
                    <span className={(userData.bio?.length || 0) > 500 ? "text-rose-400 font-black" : (userData.bio?.length || 0) > 450 ? "text-amber-400" : "text-zinc-400"}>
                      {(userData.bio?.length || 0)} / 500
                    </span>
                  </div>
                </label>

                <div className="flex flex-wrap gap-3 mt-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving || Boolean(bioError) || Boolean(emailError) || !userData.email?.trim() || (Boolean(userData.bio) && userData.bio!.length > 500)}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-lime-600 text-black font-black uppercase tracking-widest border-4 border-black shadow-[4px_4px_0_0_#000000] hover:bg-lime-500 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all disabled:opacity-50 text-xs text-center"
                  >
                    {isSaving ? "Saving..." : "Save Profile"}
                  </button>
                  <button
                    onClick={() => {
                      if (initialUserData) {
                        setUserData(initialUserData);
                      }
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                        setPreviewUrl(null);
                      }
                      setAvatarFile(null);
                      setBioError(null);
                      setEmailError(null);
                      setEditGeneralError(null);
                      setIsEditing(false);
                    }}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-zinc-700 text-white font-bold uppercase tracking-widest border-4 border-black shadow-[4px_4px_0_0_#000000] hover:bg-zinc-600 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all disabled:opacity-50 text-xs text-center"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* View mode hero card spanning full width */
          <div className="bg-zinc-800 border-4 border-black p-6 shadow-[6px_6px_0_0_#000000] space-y-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Enlarged Avatar */}
              <div className="shrink-0">
                <img
                  src={userData.avatarUrl || DEFAULT_AVATAR}
                  alt={`${userData.username} avatar`}
                  className="w-36 h-36 md:w-44 md:h-44 border-4 border-black shadow-[4px_4px_0_0_#000000] bg-zinc-900 object-cover"
                />
              </div>

              {/* Identity & Bio */}
              <div className="flex-1 min-w-0 flex flex-col items-center md:items-start text-center md:text-left w-full">
                <div className="w-full flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-wider text-zinc-100">
                      {userData.username}
                    </h1>
                    <span className="bg-lime-500 text-black font-black text-xs px-2.5 py-1 border-2 border-black uppercase tracking-widest">
                      LVL {currentLevel} • {rankTitle}
                    </span>
                  </div>

                  {isOwnProfile ? (
                    <div className="flex flex-col sm:items-end gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setInitialUserData(userData);
                          setBioError(null);
                          setEmailError(null);
                          setEditGeneralError(null);
                          setIsEditing(true);
                        }}
                        className="px-4 py-2 bg-zinc-700 text-white font-bold uppercase tracking-widest border-2 border-black shadow-[3px_3px_0_0_#000000] hover:bg-zinc-600 active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all text-xs w-full sm:w-auto text-center"
                      >
                        Edit Profile
                      </button>
                      <button
                        onClick={() => {
                          setDeleteStep(1);
                          setDeleteConfirmText("");
                          setDeleteError(null);
                          setIsDeleteModalOpen(true);
                        }}
                        className="px-4 py-2 bg-rose-700 text-white font-bold uppercase tracking-widest border-2 border-black shadow-[3px_3px_0_0_#000000] hover:bg-rose-600 active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all text-xs w-full sm:w-auto text-center"
                      >
                        Delete Account
                      </button>
                    </div>
                  ) : authUser && (
                    <div className="flex flex-col sm:items-end gap-2 shrink-0">
                      {friendshipState.status === 'none' && (
                        <button
                          onClick={handleSendFriendRequest}
                          disabled={isFriendActionLoading}
                          className="px-4 py-2 bg-lime-600 hover:bg-lime-500 text-black font-black uppercase tracking-widest border-2 border-black shadow-[3px_3px_0_0_#000000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all text-xs w-full sm:w-auto text-center disabled:opacity-50"
                        >
                          {isFriendActionLoading ? "Sending..." : "+ Send Friend Request"}
                        </button>
                      )}
                      {friendshipState.status === 'pending' && !friendshipState.isIncoming && (
                        <button
                          disabled
                          className="px-4 py-2 bg-zinc-800 text-zinc-400 font-bold uppercase tracking-widest border-2 border-black shadow-[3px_3px_0_0_#000000] text-xs w-full sm:w-auto text-center cursor-default"
                        >
                          Request Pending
                        </button>
                      )}
                      {friendshipState.status === 'pending' && friendshipState.isIncoming && (
                        <button
                          onClick={handleAcceptFriendRequest}
                          disabled={isFriendActionLoading}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest border-2 border-black shadow-[3px_3px_0_0_#000000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all text-xs w-full sm:w-auto text-center disabled:opacity-50"
                        >
                          {isFriendActionLoading ? "Accepting..." : "Accept Friend Request"}
                        </button>
                      )}
                      {friendshipState.status === 'accepted' && (
                        <div className="px-4 py-2 bg-zinc-900 border-2 border-lime-500/50 text-lime-400 font-bold uppercase tracking-widest text-xs flex items-center gap-1.5 shadow-[2px_2px_0_0_#000000]">
                          <span className="w-2 h-2 bg-lime-500 border border-black shadow-[1px_1px_0_0_#000]"></span>
                          <span>Friends</span>
                        </div>
                      )}
                      {friendActionError && (
                        <span className="text-rose-400 text-[10px] font-bold uppercase tracking-wider">
                          {friendActionError}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bio with safe wrapping for arbitrarily long text */}
                <div className="w-full mt-3">
                  <p className="text-zinc-300 text-sm leading-relaxed break-words [overflow-wrap:anywhere] whitespace-pre-wrap max-w-full">
                    {userData.bio || <span className="text-zinc-500 italic">No bio provided</span>}
                  </p>
                </div>

                {/* Level and XP progress bar */}
                <div className="w-full mt-5 bg-zinc-900 border-2 border-black p-3.5 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                    <span className="text-lime-400">
                      Level {currentLevel} Progress
                    </span>
                    <span className="text-zinc-400">
                      {currentLevelXp} / {xpPerLevel} XP ({progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-zinc-950 border border-black overflow-hidden">
                    <div
                      className="h-full bg-lime-500 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Combat Stats Grid inside the hero box */}
            <div className="pt-4 border-t-2 border-zinc-900/80">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-zinc-900 border-2 border-black p-3.5 shadow-[2px_2px_0_0_#000000] text-center">
                  <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    Matches
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-zinc-100 mt-1">
                    {stats.games_played}
                  </div>
                </div>
                <div className="bg-zinc-900 border-2 border-black p-3.5 shadow-[2px_2px_0_0_#000000] text-center">
                  <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    Wins
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-lime-400 mt-1">
                    {stats.wins}
                  </div>
                </div>
                <div className="bg-zinc-900 border-2 border-black p-3.5 shadow-[2px_2px_0_0_#000000] text-center">
                  <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    Losses
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-rose-400 mt-1">
                    {stats.losses}
                  </div>
                </div>
                <div className="bg-zinc-900 border-2 border-black p-3.5 shadow-[2px_2px_0_0_#000000] text-center">
                  <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    Win Rate
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-cyan-400 mt-1">
                    {stats.win_rate.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Row 2: Badges and Recent Matches on the EXACT SAME LEVEL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left: Badges & Achievements */}
          <div className="lg:col-span-5 xl:col-span-4 bg-zinc-800 border-4 border-black p-6 shadow-[6px_6px_0_0_#000000]">
            <div className="text-sm font-bold uppercase tracking-widest text-zinc-200 mb-4 flex items-center justify-between">
              <span>Badges & Achievements</span>
              <span className="text-xs text-lime-400 font-mono">
                {badges.filter(b => b.unlocked).length} / {badges.length}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`border-2 p-3 transition-all ${
                    badge.unlocked
                      ? "bg-zinc-900 border-lime-600 shadow-[3px_3px_0_0_#65a30d]"
                      : "bg-zinc-900/50 border-zinc-700 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`p-1.5 border border-black ${badge.unlocked ? "bg-lime-500 text-black" : "bg-zinc-800 text-zinc-500"}`}>
                      {badge.type === 'trophy' && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4m-5-9h10a4 4 0 004-4V5H3v3a4 4 0 004 4zm-4-4h4m6 0h4" />
                        </svg>
                      )}
                      {badge.type === 'friend' && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      )}
                      {badge.type === 'shield' && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      )}
                      {badge.type === 'target' && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 border ${
                      badge.unlocked
                        ? "bg-lime-950 text-lime-400 border-lime-700"
                        : "bg-zinc-800 text-zinc-500 border-zinc-700"
                    }`}>
                      {badge.unlocked ? "Earned" : "Locked"}
                    </span>
                  </div>
                  <div className="font-bold text-xs uppercase tracking-wider text-zinc-100">
                    {badge.name}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {badge.description}
                  </div>
                  {/* Progress bar for multi-step achievements */}
                  {badge.target > 1 && !badge.unlocked && (
                    <div className="mt-2 pt-2 border-t border-zinc-800/80">
                      <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 mb-1">
                        <span>Progress</span>
                        <span>{badge.progress} / {badge.target} ({badge.progress_pct}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-950 border border-black overflow-hidden">
                        <div
                          className="h-full bg-lime-500 transition-all duration-300"
                          style={{ width: `${Math.min(100, badge.progress_pct)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {badge.unlocked && badge.target > 1 && (
                    <div className="mt-1.5 text-[10px] font-mono text-lime-400 flex items-center justify-between">
                      <span>Completed</span>
                      <span>{badge.target} / {badge.target}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Recent Match History */}
          <div className="lg:col-span-7 xl:col-span-8 bg-zinc-800 border-4 border-black p-6 shadow-[6px_6px_0_0_#000000]">
            <h2 className="text-xl font-black uppercase tracking-wider text-zinc-100 mb-4">
              Recent Match History
            </h2>

            {isLoadingMatches ? (
              <div className="text-center py-6 text-zinc-400 font-bold uppercase tracking-widest text-sm">
                Loading matches...
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-8 bg-zinc-900 border-2 border-black text-zinc-400">
                <p className="font-bold uppercase tracking-widest text-sm text-zinc-300">
                  No matches recorded yet
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Enter the arena and challenge an opponent to see your history here.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  {matches.map((match) => {
                    const isInProgress = match.status === 'in_progress' || (!match.finished_at && !match.result && !match.outcome);
                    const isWin = match.outcome === 'win';
                    const isLoss = match.outcome === 'loss';
                    const isAborted = match.outcome === 'aborted';

                    return (
                      <div
                        key={match.id}
                        className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900 border-2 border-black p-3.5 shadow-[2px_2px_0_0_#000000]"
                      >
                        {/* Outcome Badge */}
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 border-2 border-black min-w-[70px] text-center ${
                              isInProgress
                                ? "bg-amber-400 text-black animate-pulse"
                                : isWin
                                ? "bg-lime-500 text-black"
                                : isLoss
                                ? "bg-rose-500 text-white"
                                : "bg-zinc-600 text-zinc-200"
                            }`}
                          >
                            {isInProgress ? "In Progress" : isWin ? "Victory" : isLoss ? "Defeat" : isAborted ? "Aborted" : "Draw"}
                          </span>

                          {/* Opponent Info */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase text-zinc-400">vs</span>
                            <Link
                              to={`/profile/${match.opponent}`}
                              className="flex items-center gap-2 text-sm font-bold text-white hover:text-lime-400 transition-colors"
                            >
                              <img
                                src={match.opponent_avatar_url || DEFAULT_AVATAR}
                                alt={match.opponent}
                                className="w-7 h-7 border border-black bg-zinc-800 object-cover"
                              />
                              <span>{match.opponent}</span>
                            </Link>
                          </div>
                        </div>

                        {/* Score and Timestamp */}
                        <div className="flex items-center gap-6">
                          <div className="text-base font-black tracking-wider text-zinc-100">
                            {match.user_score ?? 0} : {match.opponent_score ?? 0}
                          </div>
                          <div className="text-xs text-zinc-400 font-medium">
                            {formatMatchDate(match.started_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Load more matches button */}
                {hasMoreMatches && (
                  <div className="flex justify-center pt-3">
                    <button
                      type="button"
                      onClick={handleLoadMoreMatches}
                      disabled={isLoadingMoreMatches}
                      className="bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-zinc-300 font-bold uppercase tracking-wider text-xs px-6 py-2.5 border-2 border-black shadow-[2px_2px_0_0_#000000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all cursor-pointer"
                    >
                      {isLoadingMoreMatches ? "Loading more..." : "Show More Matches"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

        </div>

        {/* Row 3: Profile Comments Section (Steam-Style Scaffold) */}
        <div className="bg-zinc-800 border-4 border-black p-6 shadow-[6px_6px_0_0_#000000] space-y-6">
          <div className="flex items-center justify-between border-b-2 border-zinc-900/80 pb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black uppercase tracking-wider text-zinc-100">
                Profile Comments
              </h2>
              <span className="bg-zinc-900 text-lime-400 font-mono text-xs px-2.5 py-0.5 border border-black font-bold">
                {comments.length}
              </span>
            </div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider hidden sm:inline">
              Social Feed
            </span>
          </div>

          {/* Post Comment Input */}
          <form onSubmit={handlePostComment} className="flex flex-col gap-3 bg-zinc-900 border-2 border-black p-4">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-400">
              <span>Leave a comment for @{userData.username}</span>
              <span className={`${newCommentText.length > 900 ? 'text-amber-400' : 'text-zinc-500'} font-mono`}>
                {newCommentText.length} / 1000
              </span>
            </div>

            <textarea
              value={newCommentText}
              maxLength={1000}
              onChange={(e) => setNewCommentText(e.target.value.slice(0, 1000))}
              placeholder={`Say something nice to @${userData.username}...`}
              rows={2}
              className="bg-zinc-950 border-2 border-black p-2.5 outline-none focus:border-lime-500 transition-colors text-white tracking-wider text-sm font-medium resize-none break-words [overflow-wrap:anywhere]"
            />

            {commentError && (
              <div className="bg-red-950 border border-red-700 text-red-300 text-xs px-3 py-2 font-mono">
                {commentError}
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 font-medium">
                Plain text only • Max 1000 characters
              </span>
              <button
                type="submit"
                disabled={!newCommentText.trim() || isPostingComment}
                className="bg-lime-600 hover:bg-lime-500 disabled:opacity-40 text-black font-black uppercase tracking-wider px-5 py-2 border-2 border-black shadow-[2px_2px_0_0_#000000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all text-xs"
              >
                {isPostingComment ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-3">
            {isLoadingComments ? (
              <div className="text-center py-8 bg-zinc-900 border-2 border-black text-zinc-400 font-bold uppercase tracking-wider text-xs">
                Loading comments...
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 bg-zinc-900 border-2 border-black border-dashed text-zinc-400">
                <p className="font-bold uppercase tracking-widest text-sm text-zinc-300">
                  No comments yet
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Be the first player to sign @{userData.username}'s profile!
                </p>
              </div>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex flex-col sm:flex-row items-start justify-between gap-3 bg-zinc-900 border-2 border-black p-3.5 shadow-[2px_2px_0_0_#000000]"
                >
                  <div className="flex items-start gap-3 w-full sm:w-auto flex-1 min-w-0">
                    <Link to={`/profile/${comment.poster_username}`} className="shrink-0">
                      <img
                        src={comment.poster_avatar_url || DEFAULT_AVATAR}
                        alt={comment.poster_username}
                        className="w-9 h-9 border border-black bg-zinc-800 object-cover"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/profile/${comment.poster_username}`}
                          className="font-bold text-sm text-white hover:text-lime-400 transition-colors uppercase tracking-wider"
                        >
                          {comment.poster_username}
                        </Link>
                        <span className="text-[11px] text-zinc-400 font-medium">
                          {formatMatchDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-zinc-300 text-sm mt-1 break-words [overflow-wrap:anywhere] whitespace-pre-wrap leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>

                  {/* Delete button (only rendered if user has permission) */}
                  {canDeleteComment(comment) && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      title="Delete comment"
                      className="text-zinc-500 hover:text-rose-400 text-xs font-bold uppercase tracking-wider px-2 py-1 transition-colors self-end sm:self-start"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))
            )}

            {/* Load more comments button */}
            {hasMoreComments && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={handleLoadMoreComments}
                  disabled={isLoadingMoreComments}
                  className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 font-bold uppercase tracking-wider text-xs px-6 py-2.5 border-2 border-black shadow-[2px_2px_0_0_#000000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all"
                >
                  {isLoadingMoreComments ? "Loading more..." : "Load More Comments"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Two-step Account Deletion Confirmation Modal */}
        {isDeleteModalOpen && userData && (
          <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 font-sans">
            <div className="bg-zinc-900 border-4 border-black p-5 sm:p-8 w-full max-w-lg shadow-[6px_6px_0_0_#000000] sm:shadow-[8px_8px_0_0_#000000] text-zinc-100 space-y-6 max-h-[90vh] overflow-y-auto">
              
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b-2 border-zinc-800 pb-4">
                <div>
                  <div className="inline-block bg-rose-600 text-black font-black text-[10px] px-2 py-0.5 border border-black uppercase tracking-widest mb-1.5">
                    Danger Zone • Step {deleteStep} of 2
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-rose-500">
                    {deleteStep === 1 ? "Delete Account" : "Confirm Permanent Deletion"}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    if (!isDeleting) {
                      setIsDeleteModalOpen(false);
                      setDeleteStep(1);
                      setDeleteConfirmText("");
                      setDeleteError(null);
                    }
                  }}
                  disabled={isDeleting}
                  aria-label="Close modal"
                  className="text-zinc-400 hover:text-white font-black text-xl leading-none px-2 py-1 transition-colors disabled:opacity-30"
                >
                  ✕
                </button>
              </div>

              {deleteError && (
                <div className="p-3 bg-rose-950/80 border-2 border-rose-600 text-rose-300 text-xs font-bold uppercase tracking-wider">
                  {deleteError}
                </div>
              )}

              {/* Step 1: Warning & GDPR Disclosure */}
              {deleteStep === 1 ? (
                <div className="space-y-4">
                  <div className="bg-rose-950/30 border-2 border-rose-800/80 p-4 space-y-2 text-sm text-zinc-300">
                    <p className="font-bold text-rose-300 uppercase tracking-wide">
                      Warning: This action is permanent and cannot be undone.
                    </p>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      In accordance with GDPR ("Right to be Forgotten"), executing this action will trigger the following:
                    </p>
                    <ul className="text-xs space-y-2 pt-1 list-disc list-inside text-zinc-300">
                      <li>
                        <strong className="text-zinc-100">Identity Purge:</strong> Your email, bio, and avatar will be permanently deleted.
                      </li>
                      <li>
                        <strong className="text-zinc-100">Stats Anonymization:</strong> Your match history and records will be preserved for integrity but anonymized under a generic identifier (<span className="font-mono text-zinc-400">deleted_user_X</span>).
                      </li>
                      <li>
                        <strong className="text-zinc-100">Session Termination:</strong> All active sessions will be revoked and you will be signed out immediately.
                      </li>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsDeleteModalOpen(false)}
                      className="flex-1 py-3 px-4 bg-zinc-700 hover:bg-zinc-600 text-white font-bold uppercase tracking-widest text-xs border-2 border-black shadow-[3px_3px_0_0_#000000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      autoFocus
                      onClick={() => setDeleteStep(2)}
                      className="flex-1 py-3 px-4 bg-rose-700 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-xs border-2 border-black shadow-[3px_3px_0_0_#000000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all text-center"
                    >
                      I Understand, Continue
                    </button>
                  </div>
                </div>
              ) : (
                /* Step 2: Verification by Typing DELETE or Username */
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const isConfirmed =
                      deleteConfirmText.trim() === "DELETE" ||
                      Boolean(userData && deleteConfirmText.trim() === userData.username);
                    if (isConfirmed && !isDeleting) {
                      handleDeleteAccount();
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="bg-zinc-950 border-2 border-black p-4 space-y-3">
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      To confirm that you want to permanently delete your account, type <span className="font-mono font-bold text-rose-400">DELETE</span> or your username (<strong className="text-white font-mono">{userData.username}</strong>) below:
                    </p>
                    <input
                      ref={confirmInputRef}
                      type="text"
                      autoFocus
                      disabled={isDeleting}
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder={`Type DELETE or ${userData.username}`}
                      className="w-full bg-zinc-900 border-4 border-black p-3 text-white font-mono tracking-widest text-sm outline-none focus:border-rose-500 transition-colors"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setDeleteStep(1)}
                      disabled={isDeleting}
                      className="flex-1 py-3 px-4 bg-zinc-700 hover:bg-zinc-600 text-white font-bold uppercase tracking-widest text-xs border-2 border-black shadow-[3px_3px_0_0_#000000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all disabled:opacity-50 text-center"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={
                        isDeleting ||
                        (deleteConfirmText.trim() !== "DELETE" &&
                          deleteConfirmText.trim() !== userData.username)
                      }
                      className="flex-1 py-3 px-4 bg-rose-700 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-xs border-2 border-black shadow-[3px_3px_0_0_#000000] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed text-center"
                    >
                      {isDeleting ? "Deleting..." : "Permanently Delete"}
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}