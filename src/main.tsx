import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/app.css';
class Boundary extends React.Component<{children:React.ReactNode},{error:boolean}>{state={error:false};static getDerivedStateFromError(){return{error:true};}render(){return this.state.error?<div style={{padding:40}}><h1>3D 화면을 시작하지 못했습니다.</h1><p>Chrome의 하드웨어 가속과 WebGL 지원을 확인한 뒤 새로고침해 주세요. 저장된 판서는 유지됩니다.</p><button onClick={()=>location.reload()}>다시 시도</button></div>:this.props.children;}}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><Boundary><App/></Boundary></React.StrictMode>);
