import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  FlatList,
  SectionList,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Dimensions,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { PostService } from '~/services/PostService';
import { FriendRequest, FriendService } from '~/services/FriendService';
import { User, UserService } from '~/services/UserService';
import { getAuthToken } from '~/services/tokenService';
import { CommunityService, Community, Category } from '~/services/CommunityService';
import { Card, CardHeader, CardContent, CardFooter } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/avatar';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '~/components/ui/dialog';
import { Text } from '~/components/ui/text';
import { Badge } from '~/components/ui/badge';
import { LoopLogo } from '~/components/loop-logo';
import {
  Heart,
  MessageCircle,
  Check,
  PlusIcon,
  Funnel,
  User as UserIconLucide,
  X,
  Search,
  Users,
} from 'lucide-react-native';
import { P } from '~/components/ui/typography';
import { Alert } from 'react-native';
import { useColorScheme } from '~/lib/useColorScheme';
import { useRouter,useLocalSearchParams } from 'expo-router';
import SearchBar from '~/components/ui/searchbar';

// Tabs
const tabs = ['My Feed', 'Add Friends', 'My Friends'] as const;
type Tab = (typeof tabs)[number];

// Interfaces
type Comment = { user: string; content: string; created_at: string };
interface Post {
  id: string;
  author: { username: string; photo_url?: string };
  community: { id: number; name: string; categories: Category[] };
  topic: string;
  content: string;
  created_at: string;
  likes: number;
  comments: Comment[];
  liked_by_user: boolean;
}

export default function FeedScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

   const { tab } = useLocalSearchParams();
   const initialTab = (tab && tabs.includes(tab as Tab)) ? (tab as Tab) : 'My Feed';
   const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Posts
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Search + Category filter
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Create Post
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newContent, setNewContent] = useState('');
  const [joined, setJoined] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<number | null>(null);

  // Comments
  const screenHeight = Dimensions.get('window').height;
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');

  // Friends
  const [friendsList, setFriendsList] = useState<User[]>([]);
  const [pendingList, setPendingList] = useState<FriendRequest[]>([]);
  const [suggestedList, setSuggestedList] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [showPending, setShowPending] = useState(false); // Toggle visibility
  const [pendingModalOpen, setPendingModalOpen] = useState(false);
  const pendingCount = pendingList.length;

  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();

  // Load posts
  const loadPosts = async () => {
    setLoading(true);
    try {
      const fetchedPosts = await PostService.getPosts();
      // Make sure all post IDs are string type
      const postsWithStringId = fetchedPosts.map((post) => ({
        ...post,
        id: post.id.toString(),
        community: {
          id: Number(post.community.id),
          name: post.community.name,
          categories: post.community.categories,
        },
        author: {
          username: post.author.username,
          photo_url: post.author.photo_url,
        },
        topic: post.topic,
        content: post.content,
        created_at: post.created_at,
        likes: post.likes,
        liked_by_user: post.liked_by_user,
        comments: post.comments,
      }));
      setPosts(postsWithStringId);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // add categories
  const allCategories = React.useMemo(() => {
    const s = new Set<number>();
    posts.forEach((p) => p.community.categories?.forEach((c) => s.add(c.id)));
    return Array.from(s).map((id) => {
      const p = posts.find((p) => p.community.categories?.some((x) => x.id === id))!;
      const cat = p.community.categories!.find((x) => x.id === id)!;
      return { id: cat.id, name: cat.subtopic };
    });
  }, [posts]);

  // Filter & sort the posts before rendering, using `search` + `selectedCategories`
  const filteredAndSortedPosts = React.useMemo(() => {
    return (
      posts
        // ─ FILTER by search text
        .filter((p) => p.content.toLowerCase().includes(search.toLowerCase()))
        // ─ FILTER by chosen categories (if none selected, show all)
        .filter((p) =>
          selectedCategories.length === 0
            ? true
            : p.community.categories?.some((c) => selectedCategories.some((sc) => sc.id === c.id))
        )
        // ─ SORT by date (newest first)
        .sort((a, b) => {
          const da = new Date(a.created_at).getTime();
          const db = new Date(b.created_at).getTime();
          return db - da;
        })
    );
  }, [posts, search, selectedCategories]);

  // Fetch friends
  const fetchFriendsList = async () => {
    setLoading(true);
    try {
      const fetchedFriends = await FriendService.getMyFriends();
      setFriendsList(fetchedFriends);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending & suggested
  const fetchPendingAndSuggested = async () => {
    setLoadingFriends(true);
    try {
      setPendingList(await FriendService.getPendingRequests());
      setSuggestedList(await FriendService.suggestUsers());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFriends(false);
    }
  };

  // store user
  useEffect(() => {
    (async () => {
      const token = await getAuthToken();
      if (!token) return setCurrentUserId(null);
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUserId(payload.sub || payload.id || null);
    })();
  }, []);

  // categories
  useEffect(() => {
    const getCategories = async () => {
      setLoadingCategories(true);
      try {
        const cats = await CommunityService.getCategories();
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    getCategories();
  }, []);

  // On tab change
  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'My Feed') loadPosts();
      else if (activeTab === 'My Friends') fetchFriendsList();
      else if (activeTab === 'Add Friends') fetchPendingAndSuggested();
    }, [activeTab, currentUserId])
  );

  // Load joined communities when opening create post
  useEffect(() => {
    if (!postModalOpen) return;
    CommunityService.getJoinedCommunities()
      .then((list) => {
        setJoined(list);
        setSelectedCommunity(list[0]?.id ?? null);
      })
      .catch((err) => console.error(err));
  }, [postModalOpen]);

  // Like post
  const handleLike = async (postId: string) => {
    const resp = await PostService.toggleLike(postId);
    setPosts((ps) =>
      ps.map((p) =>
        p.id === postId ? { ...p, likes: resp.likes, liked_by_user: resp.liked_by_user } : p
      )
    );
  };

  // Create post
  const handleCreatePost = async () => {
    if (!selectedCommunity || !newTopic.trim() || !newContent.trim()) return;
    try {
      await PostService.createPost({
        communityId: selectedCommunity,
        topic: newTopic,
        content: newContent,
      });
      setPostModalOpen(false);
      setNewTopic('');
      setNewContent('');
      loadPosts();
    } catch (err) {
      console.error(err);
    }
  };

  // Comment
  const handleComment = async () => {
    if (!selectedPostId || !newComment.trim()) return;
    try {
      await PostService.commentOnPost(selectedPostId, newComment.trim());
      console.log(posts.find((p) => p.id === selectedPostId)?.comments);
      await loadPosts(); // Wait for posts to reload
      setNewComment('');
      setCommentModalOpen(false); // Close AFTER reload
    } catch (err) {
      console.error('Failed to post comment', err);
      Alert.alert('Error', 'Failed to post comment. Please try again.');
    }
  };

  // Friend requests send/respond
  const handleSendRequest = async (email: string) => {
    try {
      await FriendService.sendFriendRequest(email);
      Alert.alert(`Friend Request`, `You have sent a friend request to ${email}`, [{ text: 'OK' }]);
      fetchPendingAndSuggested();
    } catch (error) {
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  const handleRespondRequest = async (id: string, action: 'accept' | 'reject') => {
    try {
      await FriendService.respondToFriendRequest(id, action);
      Alert.alert(
        `Friend Request ${action === 'accept' ? 'Accepted' : 'Rejected'}`,
        `You have ${action === 'accept' ? 'accepted' : 'rejected'} the request.`,
        [{ text: 'OK' }]
      );
      fetchPendingAndSuggested();
    } catch (error) {
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  // Render helpers
  const renderPost = ({ item }: { item: Post }) => (
    <Card className="mb-4">
      <CardHeader className="flex-row items-center">
        <Avatar className="mr-2" alt={item.author.username}>
          {item.author.photo_url ? (
            <AvatarImage source={{ uri: item.author.photo_url }} />
                  ) : (
              <AvatarFallback className="bg-foreground">
                        <Text className="text-background">
                            {item.author.username.charAt(0)}
                        </Text>
            </AvatarFallback>
           
          )}
        </Avatar>
        <View>
          <Text className="font-semibold">{item.author.username}</Text>
          <Text className="text-sm text-muted-foreground">{item.community.name}</Text>
        </View>
      </CardHeader>
      <CardContent>
        <Text className="mb-1 text-xl font-bold">{item.topic}</Text>
        <Text>{item.content}</Text>
      </CardContent>
      <CardFooter className="flex-row justify-between">
        <TouchableOpacity onPress={() => handleLike(item.id)} className="flex-row items-center">
          <Heart color={isDarkColorScheme ? 'white' : 'black'} />
          <Text className="ml-2">{item.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setSelectedPostId(item.id);
            setCommentModalOpen(true);
          }}
          className="flex-row items-center">
          <MessageCircle color={isDarkColorScheme ? 'white' : 'black'} />
          <Text className="ml-2">{item.comments.length}</Text>
        </TouchableOpacity>
      </CardFooter>
    </Card>
  );

  const renderFriend = ({ item }: { item: User }) => {
    const router = useRouter();
    return (
      <View className="mb-8 w-1/3 items-center">
        <View className="relative">
          <Pressable
            onPress={() => router.push({ pathname: '/chat', params: { user: item.email } })}
            onLongPress={() => router.push({ pathname: '/profile', params: { userId: item.id } })}>
            <Avatar className="h-28 w-28" alt={item.firstname}>
              <AvatarImage source={{ uri: item.profile_picture }} />
              <AvatarFallback>
                <UserIconLucide size={84} />
              </AvatarFallback>
            </Avatar>
          </Pressable>
          <View className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-sky-400" />
        </View>
        <Text className="py-2 font-semibold">
          {item.firstname} {item.lastname}
        </Text>
      </View>
    );
  };

  const renderPending = ({ item }: { item: FriendRequest }) => (
    <Card className="mb-4 w-full p-1">
      <CardHeader className="mb-2 flex-row items-center px-2 py-1">
        {/* User Info */}
        <View className="flex-1 flex-row items-center space-x-1">
          <Pressable
            onPress={() => {
              router.push({ pathname: '/profile', params: { userId: item.requester_id } });
              setPendingModalOpen(false);
            }}>
            <Avatar className="mr-2" alt={item.requester}>
              <AvatarImage source={{ uri: item.profile_picture_url }} />
              <AvatarFallback>
                <UserIconLucide size={36} />
              </AvatarFallback>
            </Avatar>
          </Pressable>
          <View>
            <Text className="text-base font-bold capitalize">{item.req_name}</Text>
            <Text className="text-xs text-muted-foreground">{item.requester}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="ml-4 flex-row justify-between gap-1">
          <Button size="sm" onPress={() => handleRespondRequest(item.request_id, 'accept')}>
            <Check className="text-white"></Check>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onPress={() => handleRespondRequest(item.request_id, 'reject')}>
            <X className="text-white"></X>
          </Button>
        </View>
      </CardHeader>
    </Card>
  );

  const renderSuggested = ({ item }: { item: User }) => (
    <Card className="mb-4 flex-row items-center justify-between p-2">
      <TouchableOpacity
        className="flex-row items-center"
        onPress={() => router.push({ pathname: '/profile', params: { userId: item.id } })}>
        <Avatar className="mr-2" alt={`${item.firstname} ${item.lastname}`}>
          <AvatarImage source={{ uri: item.profile_picture }} />
                  <AvatarFallback className="bg-foreground">
                      <Text className="text-background">
                          {item.firstname.charAt(0)}
                      </Text>
                  </AvatarFallback>
        </Avatar>
        <View>
          <Text className="font-semibold">
            {item.firstname} {item.lastname}
          </Text>
          <Text className="text-sm text-muted-foreground">{item.email}</Text>
        </View>
      </TouchableOpacity>
      <Button className="ml-auto" size="sm" onPress={() => handleSendRequest(item.email)}>
        <Text>Request</Text>
      </Button>
    </Card>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="relative mx-auto items-center justify-center">
        <LoopLogo className="h-28 w-28" />
        <Text className="absolute top-20 text-sm text-foreground">Learners On Open Pathways</Text>
      </View>

      {/* Tabs */}
      <View className="flex-row justify-around py-2" style={{ marginBottom: 12 }}>
        {tabs.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'ghost'}
            onPress={() => setActiveTab(tab)}>
            <Text>{tab}</Text>
          </Button>
        ))}
      </View>

      {/* SearchBar */}
      {activeTab === 'My Feed' && (
        <View className="mb-4 px-4">
          <SearchBar
            search={search}
            onSearchChange={setSearch}
            loading={loadingCategories}
            onLoadingChange={setLoadingCategories}
            categories={categories}
            selectedCategories={selectedCategories}
            onSelectedCategoriesChange={setSelectedCategories}
          />
        </View>
      )}

      {activeTab === 'Add Friends' && (
        <View className="px-4">
          <Input placeholder="Find friends" value={search} onChangeText={setSearch} />
        </View>
      )}

      {activeTab === 'My Friends' && (
        <View className="px-4">
          <Input
            placeholder="Search existing friends"
            value={search}
            onChangeText={setSearch}
            className="mb-4"
          />
        </View>
      )}

      {/* Content */}
      {activeTab === 'My Feed' &&
        (loading ? (
          <Text>Loading...</Text>
        ) : (
          <FlatList
            data={filteredAndSortedPosts} // ← use your memo’d, category-aware array
            renderItem={renderPost}
            keyExtractor={(p) => p.id}
            contentContainerStyle={{ padding: 16 }}
          />
        ))}

      {activeTab === 'My Friends' && (
        <FlatList
          data={friendsList.filter(
            (user) =>
              user.firstname.toLowerCase().includes(search.toLowerCase()) ||
              user.lastname.toLowerCase().includes(search.toLowerCase()) ||
              user.email.toLowerCase().includes(search.toLowerCase())
          )}
          keyExtractor={(item) => item.email}
          renderItem={renderFriend}
          // 1) show empty text when data = []
          ListEmptyComponent={<Text>You have no friends yet.</Text>}
          // 2) make the FlatList fill its parent so the empty component is visible
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
          numColumns={3}
        />
      )}

      {activeTab === 'Add Friends' && (
        <SectionList<FriendRequest | User>
          sections={[
            {
              title: 'Suggested Users',
              data: suggestedList.filter((u) =>
                u.firstname.toLowerCase().includes(search.toLowerCase())
              ),
            },
          ]}
          keyExtractor={(item, idx) =>
            'request_id' in item ? item.request_id : `${item.email}-${idx}`
          }
          renderSectionHeader={({ section: { title } }) => (
            <Text className="px-4 py-2 font-semibold">{title}</Text>
          )}
          renderItem={({ section, item }) =>
            section.title === 'Pending Requests'
              ? renderPending({ item: item as FriendRequest })
              : renderSuggested({ item: item as User })
          }
                  contentContainerStyle={{ padding: 16 }}
        />
      )}

      {/* Create Post Dialog */}
      {activeTab === 'My Feed' && (
        <Dialog open={postModalOpen} onOpenChange={setPostModalOpen}>
          <DialogTrigger asChild>
            <Button className="mx-6 mb-4 mt-2 flex flex-row items-center gap-2">
              <PlusIcon color={isDarkColorScheme ? 'black' : 'white'} />
              <P className="text-background">New Post</P>
            </Button>
          </DialogTrigger>
          <DialogContent style={{ width: width - 16, height: screenHeight * 0.65 }}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0} // adjust if needed
            >
              <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled">
                <DialogHeader>
                  <DialogTitle>Create a Post</DialogTitle>
                  <DialogDescription>Share your thoughts</DialogDescription>
                </DialogHeader>

                <Input
                  placeholder="Topic"
                  value={newTopic}
                  onChangeText={setNewTopic}
                  className="mb-4"
                />

                <Picker
                  selectedValue={selectedCommunity}
                  onValueChange={(v) => setSelectedCommunity(v)}
                  className="mb-4">
                  {joined.map((c) => (
                    <Picker.Item key={c.id} label={c.name} value={c.id} />
                  ))}
                </Picker>

                <Input
                  placeholder="What's on your mind?"
                  value={newContent}
                  onChangeText={setNewContent}
                  multiline
                  className="mb-4 h-32"
                />

                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">
                      <Text>Cancel</Text>
                    </Button>
                  </DialogClose>
                  <Button variant="default" onPress={handleCreatePost}>
                    <Text>Post</Text>
                  </Button>
                </DialogFooter>
              </ScrollView>
            </KeyboardAvoidingView>
          </DialogContent>
        </Dialog>
      )}

      {/* Comment Dialog */}
      <Dialog open={commentModalOpen} onOpenChange={setCommentModalOpen}>
        <DialogContent
          style={{
            width: width - 16,
            height: screenHeight * 0.75, // <-- fix at 75% of screen
          }}>
          {/* Let RN adjust this block when keyboard appears */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}>
            {/* Header stays at top */}
            <DialogHeader>
              <DialogTitle>Comments</DialogTitle>
            </DialogHeader>

            <View style={{ flex: 1 }}>
              <FlatList
                data={posts.find((p) => p.id === selectedPostId)?.comments ?? []}
                renderItem={({ item }) => (
                  <View className="mb-3">
                    <Text className="font-semibold">{item.user}</Text>
                    <Text>{item.content}</Text>
                    <Text className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleString()}
                    </Text>
                  </View>
                )}
                keyExtractor={(c) => c.created_at}
                nestedScrollEnabled
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
              />

              {/* “Write a comment” input sticks below the list */}
              <Input
                placeholder="Write a comment..."
                value={newComment}
                onChangeText={setNewComment}
                className="mb-4"
              />
            </View>

            {/* Post/Cancel buttons at the very bottom */}
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" className="mb-2">
                  <Text>Cancel</Text>
                </Button>
              </DialogClose>
              <Button variant="default" onPress={handleComment}>
                <Text>Post</Text>
              </Button>
            </DialogFooter>
          </KeyboardAvoidingView>
        </DialogContent>
      </Dialog>

      {/* Open Pending Friends Dialog */}
      {activeTab === 'Add Friends' && (
        <Dialog open={pendingModalOpen} onOpenChange={setPendingModalOpen}>
          <View className="absolute bottom-4 right-4">
            <DialogTrigger asChild>
              <Button
                variant="default"
                className="flex flex-row items-center justify-center gap-2 rounded-full px-4 py-2 hover:bg-primary/80">
                <Users color="white" size={20} />
                <Text className="text-lg text-white">Pending Requests</Text>
                {pendingCount > 0 && (
                  <View className="absolute -right-1 -top-1  items-center justify-center rounded-full bg-red-500">
                    <Text className="text-red font-bold px-2 py-0.5" style={{ fontSize: 12 }}>+{pendingCount}</Text>
                  </View>
                )}
              </Button>
            </DialogTrigger>
          </View>
          <DialogContent style={{ width: width - 32 }}>
            <DialogHeader>
              <DialogTitle>Pending Requests</DialogTitle>
            </DialogHeader>
            <FlatList
              data={pendingList}
              keyExtractor={(item) => item.request_id}
              renderItem={renderPending}
              ListEmptyComponent={<Text>No incoming requests.</Text>}
            />
          </DialogContent>
        </Dialog>
      )}
    </SafeAreaView>
  );
}
