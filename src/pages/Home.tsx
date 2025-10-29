import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // 自动重定向到登录页面
    navigate('/login', { replace: true });
  }, [navigate]);
  
  return null;
}