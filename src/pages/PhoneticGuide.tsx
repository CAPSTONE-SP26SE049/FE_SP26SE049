import { Button } from '../components/ui/Button';
import { Volume2, BookOpen, Music } from '../lib/icons';

const PhoneticGuide = () => {
    return (
        <div className="max-w-4xl mx-auto pt-10 pb-20 px-6">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Cẩm Nang Phát Âm</h1>
                <p className="text-gray-500 max-w-lg mx-auto">Nắm vững các sắc thái của các giọng vùng miền Việt Nam với hướng dẫn tương tác của chúng tôi.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Vowels */}
                <div className="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="bg-blue-100 text-brand-blue p-2 rounded-lg"><BookOpen size={20} /></span>
                        Nguyên Âm
                    </h2>
                    <div className="space-y-4">
                        <div className="p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer border border-transparent hover:border-blue-200">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-extrabold text-2xl text-gray-800">a / ă / â</span>
                                <Volume2 size={20} className="text-brand-blue" />
                            </div>
                            <p className="text-sm text-gray-500">
                                'a' dài và mở. 'ă' ngắn và bật. 'â' ngắn hơn và nâng cao hơn.
                            </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer border border-transparent hover:border-blue-200">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-extrabold text-2xl text-gray-800">o / ô / ơ</span>
                                <Volume2 size={20} className="text-brand-blue" />
                            </div>
                            <p className="text-sm text-gray-500">
                                'o' tròn môi. 'ô' tròn và hẹp hơn. 'ơ' thư giãn và trung tính.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tones */}
                <div className="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="bg-purple-100 text-brand-purple p-2 rounded-lg"><Music size={20} /></span>
                        Thanh Điệu
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-2">
                            <div className="w-10 h-10 rounded-full bg-brand-green text-white flex items-center justify-center font-bold">1</div>
                            <div>
                                <div className="font-bold text-gray-800">Thanh Ngang (Không dấu)</div>
                                <div className="text-xs text-gray-500">Cao độ ngang và đều</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-2">
                            <div className="w-10 h-10 rounded-full bg-brand-yellow text-white flex items-center justify-center font-bold">2</div>
                            <div>
                                <div className="font-bold text-gray-800">Thanh Sắc (Dấu sắc)</div>
                                <div className="text-xs text-gray-500">Bắt đầu cao và lên giọng nhanh</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-2">
                            <div className="w-10 h-10 rounded-full bg-brand-red text-white flex items-center justify-center font-bold">3</div>
                            <div>
                                <div className="font-bold text-gray-800">Thanh Huyền (Dấu huyền)</div>
                                <div className="text-xs text-gray-500">Bắt đầu thấp và xuống giọng</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 bg-brand-green/10 p-6 rounded-2xl border border-brand-green/20 flex flex-col md:flex-row items-center gap-6">
                <div className="bg-white p-4 rounded-full shadow-md">
                    <span className="text-4xl">💡</span>
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h3 className="text-lg font-bold text-brand-green mb-1">Mẹo chuyên nghiệp: Sự nhầm lẫn N/L</h3>
                    <p className="text-gray-600">
                        Ở nhiều giọng miền Bắc, 'N' và 'L' thường bị phát âm sai. Hãy nhớ: 'N' là âm mũi (luồng hơi qua mũi), trong khi 'L' là âm bên (luồng hơi qua hai bên lưỡi).
                    </p>
                </div>
                <Button>LUYỆN TẬP NGAY</Button>
            </div>
        </div>
    );
};

export default PhoneticGuide;
