import { Shield } from 'lucide-react';
import { Button } from '../components/ui/Button';

const LeaderboardRow = ({ rank, name, xp, isUser, avatar }: any) => (
    <div className={`flex items-center justify-between p-4 rounded-xl mb-2 ${isUser ? 'bg-brand-green/10 border-2 border-brand-green' : 'hover:bg-gray-50'}`}>
        <div className="flex items-center gap-4">
            <div className="font-bold text-lg text-gray-500 w-8">{rank}</div>
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xl">
                {avatar}
            </div>
            <div className={`font-bold ${isUser ? 'text-brand-green' : 'text-gray-700'}`}>
                {name} {isUser && '(Bạn)'}
            </div>
        </div>
        <div className="font-bold text-gray-600">{xp} XP</div>
    </div>
);

const MOCK_LEADERS = [
    { rank: 1, name: "Nguyen Van A", xp: "1450", avatar: "🥇" },
    { rank: 2, name: "Tran Thi B", xp: "1320", avatar: "🥈" },
    { rank: 3, name: "Le Van C", xp: "1280", avatar: "🥉" },
    { rank: 4, name: "Pham Thi D", xp: "1100", avatar: "👩" },
    { rank: 5, name: "Hoang Van E", xp: "950", avatar: "👨" },
    { rank: 6, name: "PlayerOne", xp: "850", avatar: "😎", isUser: true },
    { rank: 7, name: "User 123", xp: "700", avatar: "🧑" },
    { rank: 8, name: "User 456", xp: "650", avatar: "👧" },
];

const Leaderboard = () => {
    return (
        <div className="max-w-2xl mx-auto pt-10 pb-20">
            <div className="flex items-center gap-4 mb-8 justify-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-brand-blue">
                    <Shield size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-700">Hạng Kim Cương</h2>
                    <p className="text-gray-400 font-bold text-sm">Top 10 thăng hạng</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm">
                <div className="p-4 bg-gray-50 border-b border-gray-200 text-center font-bold text-gray-500 text-xs uppercase tracking-wider">
                    Kết thúc trong 2 ngày 4 giờ
                </div>

                <div className="p-2">
                    {MOCK_LEADERS.map((user) => (
                        <LeaderboardRow
                            key={user.rank}
                            rank={user.rank}
                            name={user.name}
                            xp={user.xp}
                            isUser={user.isUser}
                            avatar={user.avatar}
                        />
                    ))}
                </div>

                <div className="p-4 border-t border-gray-200 text-center">
                    <Button variant="ghost" className="text-brand-blue uppercase text-sm">Xem giải đấu toàn cầu</Button>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
