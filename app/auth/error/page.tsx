'use client';

import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-4 text-center">
      <div className="max-w-md w-full space-y-8 bg-[#111] p-10 rounded-[32px] border border-white/5 shadow-2xl">
        <h1 className="text-3xl font-bold mb-4">Shay ☕</h1>
        
        <div className="space-y-6 text-gray-400">
          <div>
            <p className="text-white font-medium">Limited Edition only.</p>
            <p className="text-sm">Please use your <span className="text-white">student/university email</span> to prove you are a student.</p>
          </div>
          
          <div>
            <p className="text-white font-medium">Только для своих.</p>
            <p className="text-sm">Пожалуйста, используйте <span className="text-white">почту студента/университета</span>, чтобы подтвердить статус студента.</p>
          </div>
          
          <div>
            <p className="text-white font-medium">Тек студенттер үшін.</p>
            <p className="text-sm">Студент екеніңізді растау үшін <span className="text-white">студент/университет поштасын</span> пайдаланыңыз.</p>
          </div>
        </div>

        {/* Кнопка с принудительными стилями */}
        <Link 
          href="/signin"
          style={{
            display: 'inline-block',
            width: '100%',
            padding: '16px 0',
            backgroundColor: '#ffffff',
            color: '#000000',
            fontWeight: 'bold',
            borderRadius: '16px',
            marginTop: '32px',
            textDecoration: 'none'
          }}
          className="hover:opacity-90 transition-opacity"
        >
          Try Again / Заново / Қайталау
        </Link>
      </div>
    </div>
  );
}