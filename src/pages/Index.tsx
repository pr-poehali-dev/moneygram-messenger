import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  username: string;
  password: string;
  displayName: string;
  avatar: string;
  avatarColor: string;
  role: 'user' | 'admin';
  status: 'active' | 'banned' | 'frozen';
  level: 'new' | 'active' | 'premium';
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: number;
}

interface Chat {
  id: string;
  name: string;
  type: 'chat' | 'channel' | 'group';
  avatar: string;
  lastMessage?: string;
  unread?: number;
  verified?: boolean;
  scam?: boolean;
  subscribers?: number;
}

const AVATAR_OPTIONS = ['😎', '🚀', '💜', '⚡', '🎮', '🎨', '🌟', '🔥'];
const COLOR_OPTIONS = [
  'linear-gradient(135deg, #9b87f5 0%, #D946EF 100%)',
  'linear-gradient(135deg, #7E69AB 0%, #9b87f5 100%)',
  'linear-gradient(135deg, #1A1F2C 0%, #7E69AB 100%)',
  'linear-gradient(135deg, #D946EF 0%, #9b87f5 100%)',
  'linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%)',
  'linear-gradient(135deg, #6E59A5 0%, #8B5CF6 100%)',
];

export default function Index() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  
  const [view, setView] = useState<'messenger' | 'profile' | 'admin'>('messenger');
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    
    const savedChats = localStorage.getItem('chats');
    if (savedChats) {
      setChats(JSON.parse(savedChats));
    } else {
      const defaultChats: Chat[] = [
        { id: '1', name: 'MoneyGram Support', type: 'chat', avatar: '💬', verified: true },
        { id: '2', name: 'Новости MoneyGram', type: 'channel', avatar: '📢', verified: true, subscribers: 1247 },
        { id: '3', name: 'Общий чат', type: 'group', avatar: '👥', subscribers: 523 },
      ];
      setChats(defaultChats);
      localStorage.setItem('chats', JSON.stringify(defaultChats));
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAuth = () => {
    if (!username || !password) {
      toast({ title: 'Ошибка', description: 'Заполните все поля', variant: 'destructive' });
      return;
    }

    const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');

    if (isLogin) {
      const user = users.find(u => u.username === username && u.password === password);
      if (user) {
        if (user.status === 'banned') {
          toast({ title: 'Доступ запрещён', description: 'Ваш аккаунт заблокирован', variant: 'destructive' });
          return;
        }
        if (user.status === 'frozen') {
          toast({ title: 'Аккаунт заморожен', description: 'Обратитесь в поддержку', variant: 'destructive' });
          return;
        }
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        toast({ title: 'Добро пожаловать!', description: `Привет, ${user.displayName}!` });
      } else {
        toast({ title: 'Ошибка', description: 'Неверный логин или пароль', variant: 'destructive' });
      }
    } else {
      if (!displayName) {
        toast({ title: 'Ошибка', description: 'Укажите имя профиля', variant: 'destructive' });
        return;
      }
      if (users.find(u => u.username === username)) {
        toast({ title: 'Ошибка', description: 'Пользователь уже существует', variant: 'destructive' });
        return;
      }
      
      const newUser: User = {
        id: Date.now().toString(),
        username,
        password,
        displayName,
        avatar: selectedAvatar,
        avatarColor: selectedColor,
        role: 'user',
        status: 'active',
        level: 'new'
      };
      
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      setCurrentUser(newUser);
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      toast({ title: 'Регистрация успешна!', description: 'Добро пожаловать в MoneyGram!' });
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedChat) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      chatId: selectedChat.id,
      senderId: currentUser!.id,
      text: messageInput,
      timestamp: Date.now()
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    localStorage.setItem(`messages_${selectedChat.id}`, JSON.stringify(updatedMessages));
    setMessageInput('');

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        chatId: selectedChat.id,
        senderId: 'ai',
        text: generateAIResponse(messageInput),
        timestamp: Date.now()
      };
      const withAI = [...updatedMessages, aiResponse];
      setMessages(withAI);
      localStorage.setItem(`messages_${selectedChat.id}`, JSON.stringify(withAI));
    }, 1000);
  };

  const generateAIResponse = (input: string): string => {
    const responses = [
      'Спасибо за ваше сообщение! Как я могу помочь?',
      'Это очень интересно! Расскажите подробнее.',
      'Понял вас. Сейчас уточню информацию.',
      'Отличный вопрос! Давайте разберемся.',
      'Я всегда рад помочь! 😊'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    const savedMessages = localStorage.getItem(`messages_${chat.id}`);
    setMessages(savedMessages ? JSON.parse(savedMessages) : []);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    toast({ title: 'Выход выполнен', description: 'До скорой встречи!' });
  };

  const updateProfile = () => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, displayName, avatar: selectedAvatar, avatarColor: selectedColor };
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
    const index = users.findIndex(u => u.id === currentUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      localStorage.setItem('users', JSON.stringify(users));
    }
    
    toast({ title: 'Профиль обновлён', description: 'Изменения сохранены!' });
  };

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentUser) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0D0B14] via-[#1A1F2C] to-[#2D1B4E]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float"
              style={{
                left: `${(i * 8 + (mousePosition.x / 50)) % 100}%`,
                top: `${(i * 7 + (mousePosition.y / 50)) % 100}%`,
                width: `${40 + i * 10}px`,
                height: `${40 + i * 10}px`,
                background: i % 2 === 0 
                  ? 'linear-gradient(135deg, rgba(155, 135, 245, 0.1), rgba(217, 70, 239, 0.1))'
                  : 'linear-gradient(135deg, rgba(126, 105, 171, 0.1), rgba(139, 92, 246, 0.1))',
                borderRadius: '20%',
                transform: `rotate(${i * 30}deg)`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${15 + i * 2}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8 glass-effect border-purple-500/20 animate-fadeIn">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-2">
                MoneyGram
              </h1>
              <p className="text-gray-400">Современный мессенджер</p>
            </div>

            <Tabs value={isLogin ? 'login' : 'register'} onValueChange={(v) => setIsLogin(v === 'login')} className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Вход</TabsTrigger>
                <TabsTrigger value="register">Регистрация</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <Input
                  placeholder="Логин"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-black/30 border-purple-500/30"
                  onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                />
                <Input
                  type="password"
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-black/30 border-purple-500/30"
                  onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                />
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <Input
                  placeholder="Логин"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-black/30 border-purple-500/30"
                />
                <Input
                  type="password"
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-black/30 border-purple-500/30"
                />
                <Input
                  placeholder="Имя профиля"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-black/30 border-purple-500/30"
                  onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                />

                <div>
                  <p className="text-sm text-gray-400 mb-2">Выберите аватар:</p>
                  <div className="flex gap-2 flex-wrap">
                    {AVATAR_OPTIONS.map((av) => (
                      <button
                        key={av}
                        onClick={() => setSelectedAvatar(av)}
                        className={`w-12 h-12 rounded-full text-2xl flex items-center justify-center transition-transform hover:scale-110 ${
                          selectedAvatar === av ? 'ring-2 ring-purple-500' : ''
                        }`}
                        style={{ background: selectedColor }}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-2">Цвет фона:</p>
                  <div className="flex gap-2 flex-wrap">
                    {COLOR_OPTIONS.map((color, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedColor(color)}
                        className={`w-10 h-10 rounded-lg transition-transform hover:scale-110 ${
                          selectedColor === color ? 'ring-2 ring-white' : ''
                        }`}
                        style={{ background: color }}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <Button onClick={handleAuth} className="w-full gradient-purple hover:opacity-90 transition-opacity">
              {isLogin ? 'Войти' : 'Зарегистрироваться'}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0D0B14] via-[#1A1F2C] to-[#2D1B4E]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${(i * 6.5 + (mousePosition.x / 60)) % 100}%`,
              top: `${(i * 6 + (mousePosition.y / 60)) % 100}%`,
              width: `${30 + i * 8}px`,
              height: `${30 + i * 8}px`,
              background: i % 3 === 0 
                ? 'linear-gradient(135deg, rgba(155, 135, 245, 0.08), rgba(217, 70, 239, 0.08))'
                : i % 3 === 1
                ? 'linear-gradient(135deg, rgba(126, 105, 171, 0.08), rgba(139, 92, 246, 0.08))'
                : 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(155, 135, 245, 0.08))',
              borderRadius: '25%',
              transform: `rotate(${i * 25}deg)`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${18 + i * 1.5}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 h-screen flex">
        <aside className="w-20 glass-effect border-r border-purple-500/20 flex flex-col items-center py-6 space-y-6">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl cursor-pointer hover:scale-110 transition-transform"
            style={{ background: currentUser.avatarColor }}
            onClick={() => setView('profile')}
          >
            {currentUser.avatar}
          </div>

          <Button
            variant={view === 'messenger' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setView('messenger')}
            className="rounded-full"
          >
            <Icon name="MessageCircle" size={20} />
          </Button>

          {currentUser.role === 'admin' && (
            <Button
              variant={view === 'admin' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setView('admin')}
              className="rounded-full"
            >
              <Icon name="Shield" size={20} />
            </Button>
          )}

          <div className="flex-1" />

          <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full">
            <Icon name="LogOut" size={20} />
          </Button>
        </aside>

        {view === 'messenger' && (
          <>
            <div className="w-80 glass-effect border-r border-purple-500/20 flex flex-col">
              <div className="p-4 border-b border-purple-500/20">
                <Input
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-black/30 border-purple-500/30"
                />
              </div>

              <Tabs defaultValue="chats" className="flex-1 flex flex-col">
                <TabsList className="mx-4 mt-4 grid w-[calc(100%-2rem)] grid-cols-3">
                  <TabsTrigger value="chats">Чаты</TabsTrigger>
                  <TabsTrigger value="channels">Каналы</TabsTrigger>
                  <TabsTrigger value="groups">Группы</TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1">
                  {['chats', 'channels', 'groups'].map(tabType => (
                    <TabsContent key={tabType} value={tabType} className="mt-0">
                      {filteredChats
                        .filter(c => c.type === tabType.slice(0, -1) || (tabType === 'chats' && c.type === 'chat'))
                        .map(chat => (
                          <div
                            key={chat.id}
                            onClick={() => handleSelectChat(chat)}
                            className={`p-4 cursor-pointer hover:bg-purple-500/10 transition-colors border-b border-purple-500/10 ${
                              selectedChat?.id === chat.id ? 'bg-purple-500/20' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
                                {chat.avatar}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold truncate">{chat.name}</h3>
                                  {chat.verified && <Icon name="BadgeCheck" size={16} className="text-blue-500" />}
                                  {chat.scam && <Badge variant="destructive" className="text-xs">SCAM</Badge>}
                                </div>
                                {chat.subscribers && (
                                  <p className="text-xs text-gray-400">{chat.subscribers} подписчиков</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </TabsContent>
                  ))}
                </ScrollArea>
              </Tabs>
            </div>

            <div className="flex-1 flex flex-col">
              {selectedChat ? (
                <>
                  <div className="p-4 glass-effect border-b border-purple-500/20 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl">
                      {selectedChat.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold">{selectedChat.name}</h2>
                        {selectedChat.verified && <Icon name="BadgeCheck" size={16} className="text-blue-500" />}
                      </div>
                      {selectedChat.subscribers && (
                        <p className="text-xs text-gray-400">{selectedChat.subscribers} подписчиков</p>
                      )}
                    </div>
                  </div>

                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl p-3 ${
                              msg.senderId === currentUser.id
                                ? 'gradient-purple text-white'
                                : 'glass-effect'
                            }`}
                          >
                            <p>{msg.text}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="p-4 glass-effect border-t border-purple-500/20">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Введите сообщение..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="bg-black/30 border-purple-500/30"
                      />
                      <Button onClick={handleSendMessage} className="gradient-purple">
                        <Icon name="Send" size={20} />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Icon name="MessageCircle" size={64} className="mx-auto mb-4 opacity-50" />
                    <p>Выберите чат для начала общения</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {view === 'profile' && (
          <div className="flex-1 flex items-center justify-center p-8">
            <Card className="w-full max-w-lg p-8 glass-effect border-purple-500/20 animate-fadeIn">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                Профиль
              </h2>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                    style={{ background: selectedColor }}
                  >
                    {selectedAvatar}
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">@{currentUser.username}</p>
                    <Badge className={currentUser.level === 'premium' ? 'gradient-purple' : ''}>
                      {currentUser.level === 'new' && '🌱 Новичок'}
                      {currentUser.level === 'active' && '⚡ Активный'}
                      {currentUser.level === 'premium' && '👑 Премиум'}
                    </Badge>
                  </div>
                </div>

                <Input
                  placeholder="Имя профиля"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-black/30 border-purple-500/30"
                />

                <div>
                  <p className="text-sm text-gray-400 mb-2">Аватар:</p>
                  <div className="flex gap-2 flex-wrap">
                    {AVATAR_OPTIONS.map((av) => (
                      <button
                        key={av}
                        onClick={() => setSelectedAvatar(av)}
                        className={`w-12 h-12 rounded-full text-2xl flex items-center justify-center transition-transform hover:scale-110 ${
                          selectedAvatar === av ? 'ring-2 ring-purple-500' : ''
                        }`}
                        style={{ background: selectedColor }}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-2">Цвет:</p>
                  <div className="flex gap-2 flex-wrap">
                    {COLOR_OPTIONS.map((color, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedColor(color)}
                        className={`w-10 h-10 rounded-lg transition-transform hover:scale-110 ${
                          selectedColor === color ? 'ring-2 ring-white' : ''
                        }`}
                        style={{ background: color }}
                      />
                    ))}
                  </div>
                </div>

                <Button onClick={updateProfile} className="w-full gradient-purple">
                  Сохранить изменения
                </Button>

                <Button onClick={() => setView('messenger')} variant="outline" className="w-full">
                  Назад к мессенджеру
                </Button>
              </div>
            </Card>
          </div>
        )}

        {view === 'admin' && currentUser.role === 'admin' && (
          <div className="flex-1 p-8 overflow-auto">
            <Card className="glass-effect border-purple-500/20 p-6 animate-fadeIn">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                Админ-панель
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4 bg-purple-500/10 border-purple-500/30">
                    <p className="text-sm text-gray-400">Всего пользователей</p>
                    <p className="text-3xl font-bold">
                      {JSON.parse(localStorage.getItem('users') || '[]').length}
                    </p>
                  </Card>
                  <Card className="p-4 bg-purple-500/10 border-purple-500/30">
                    <p className="text-sm text-gray-400">Активных чатов</p>
                    <p className="text-3xl font-bold">{chats.length}</p>
                  </Card>
                  <Card className="p-4 bg-purple-500/10 border-purple-500/30">
                    <p className="text-sm text-gray-400">Сообщений</p>
                    <p className="text-3xl font-bold">
                      {Object.keys(localStorage).filter(k => k.startsWith('messages_')).length}
                    </p>
                  </Card>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4">Управление пользователями</h3>
                  <ScrollArea className="h-96">
                    {JSON.parse(localStorage.getItem('users') || '[]').map((user: User) => (
                      <Card key={user.id} className="p-4 mb-2 bg-black/30 border-purple-500/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                              style={{ background: user.avatarColor }}
                            >
                              {user.avatar}
                            </div>
                            <div>
                              <p className="font-semibold">{user.displayName}</p>
                              <p className="text-sm text-gray-400">@{user.username}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                              {user.status}
                            </Badge>
                            {user.role === 'admin' && <Badge className="gradient-purple">Admin</Badge>}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </ScrollArea>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
