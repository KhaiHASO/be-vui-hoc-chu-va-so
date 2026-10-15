"use client";

import React from "react";
import { NumberCardData } from "@/types/number";
import { HeartHandshake, BookOpen, Sparkles, HelpCircle } from "lucide-react";

interface ParentGuideViewProps {
  numbers: NumberCardData[];
  currentNumber: NumberCardData;
}

export const ParentGuideView: React.FC<ParentGuideViewProps> = ({ numbers, currentNumber }) => {
  return (
    <div className="flex flex-col max-w-5xl mx-auto py-6">
      {/* Banner Giới thiệu cho phụ huynh */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white shadow-xl mb-8">
        <div className="flex items-center gap-2 text-rose-100 font-bold text-xs uppercase tracking-wider mb-2">
          <HeartHandshake className="w-5 h-5 text-amber-200" />
          Dành riêng cho Phụ huynh học sinh lớp 1
        </div>
        <h2 className="text-2xl sm:text-3xl font-black">
          Cẩm Nang Sư Phạm: Dạy Con Tách - Gộp & Viết Số
        </h2>
        <p className="text-rose-100 text-sm sm:text-base mt-2 max-w-2xl">
          Tách - gộp số là phương pháp cốt lõi trong chương trình Toán tiểu học mới, giúp con hiểu bản chất phép cộng và trừ một cách tự nhiên mà không cần học vẹt.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* CỘT TRÁI (7 cột): Bảng tra cứu các cách tách gộp của số hiện tại & các số khác */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-rose-500" />
                Bảng Tách - Gộp Số {currentNumber.number} ({currentNumber.word})
              </h3>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700">
                Thẻ {currentNumber.card_id}
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Phụ huynh có thể đố miệng con theo các câu dưới đây để tạo phản xạ nhanh:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentNumber.all_bonds.map((bond, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-rose-300 transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-800">{bond.split_sentence}</p>
                    <p className="text-xs text-slate-500">{bond.combine_sentence}</p>
                  </div>
                  <div className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
                    {bond.part_a} + {bond.part_b}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lộ trình 3 bước sư phạm tại nhà */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-base font-black text-slate-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Quy trình 3 bước giúp con nắm vững cấu tạo số
            </h3>

            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 font-black flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Bước 1: Trực quan hóa bằng vật thật</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Dùng que tính, viên kẹo hoặc ngón tay. Cho con 4 viên kẹo, bảo con chia cho bố mẹ và con để thấy rõ &ldquo;4 gồm 1 và 3&rdquo;.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 font-black flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Bước 2: Chuyển đổi sang sơ đồ nhánh</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Vẽ 1 vòng tròn to và 2 vòng tròn con rẽ nhánh. Hướng dẫn con đọc đúng khẩu quyết: &ldquo;4 gồm 1 và 3&rdquo; và ngược lại &ldquo;gộp 1 và 3 được 4&rdquo;.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Bước 3: Phản xạ đố vui nhanh</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Hỏi con bất chợt lúc đi dạo hoặc trước khi đi ngủ: &ldquo;Đố con 5 gồm 2 và mấy?&rdquo;. Khi con phản xạ ngay là 3, con sẽ học phép cộng trừ sau này cực kỳ nhàn!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (5 cột): Lưu ý lỗi viết & Bảng 10 số nhanh */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Lỗi viết sai của số hiện tại */}
          <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-2">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              Lỗi viết con hay mắc ở số {currentNumber.number}:
            </div>
            <p className="text-sm text-slate-700 bg-white p-3.5 rounded-xl border border-amber-200/60 font-medium">
              ⚠️ {currentNumber.writing_guide.common_mistakes}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              👉 Nhắc con: Chữ số cao đúng 2 ô ly, nét bút không đè quá mạnh làm rách vở.
            </p>
          </div>

          {/* Danh mục nhanh 10 số */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h4 className="text-sm font-black text-slate-800 mb-3">
              Danh mục 10 số & Vật đại diện trong bộ thẻ:
            </h4>
            <div className="flex flex-col gap-1.5">
              {numbers.map((n) => (
                <div
                  key={n.number}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs font-semibold ${
                    n.number === currentNumber.number ? "bg-rose-50 text-rose-700 font-bold" : "text-slate-600"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center font-black text-slate-700">
                      {n.number}
                    </span>
                    <span>{n.word}</span>
                  </span>
                  <span className="text-slate-400">{n.count} {n.item_name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
