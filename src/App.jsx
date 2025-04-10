import React, { useState, useRef, useEffect } from 'react';
import './App.css';


function App() {
  const [cameraActive, setCameraActive] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);
  
  const videoRef = useRef(null);
  const photoCanvasRef = useRef(null);
  const streamRef = useRef(null);

  // Verificar suporte à câmera quando o componente carrega
  useEffect(() => {
    // Verificar se o navegador suporta a API MediaDevices
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Seu navegador não suporta acesso à câmera. Tente usar um navegador mais recente como Chrome ou Firefox.');
      return;
    }
  }, []);

  // Limpar stream de vídeo quando componente for desmontado
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Iniciar a câmera com tratamento de erros melhorado
  const startCamera = async () => {
    setError('');
    
    // Verificar suporte à câmera novamente
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Seu navegador não suporta acesso à câmera.');
      return;
    }

    try {
      // Solicitar apenas permissão primeiro
      const permission = await navigator.permissions.query({ name: 'camera' });
      setCameraPermission(permission.state);
      
      if (permission.state === 'denied') {
        setError('Permissão de câmera negada. Por favor, permita o acesso à câmera nas configurações do seu navegador.');
        return;
      }

      // Tentar com diferentes configurações caso falhe
      let stream;
      try {
        // Primeiro tente com configuração ideal
        const constraints = {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: { ideal: 'environment' }
          }
        };
        
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.warn('Falha ao usar configurações ideais, tentando configurações básicas', err);
        
        // Segundo: tente configuração mais básica
        const basicConstraints = {
          video: true
        };
        
        stream = await navigator.mediaDevices.getUserMedia(basicConstraints);
      }
      
      // Se chegou aqui, temos um stream válido
      console.log('Câmera iniciada com sucesso');
      streamRef.current = stream;
      
      // Verificar se o elemento de vídeo existe
      if (!videoRef.current) {
        throw new Error('Elemento de vídeo não encontrado');
      }
      
      // Conectar stream ao elemento de vídeo
      videoRef.current.srcObject = stream;
      
      // Garantir que o vídeo esteja pronto antes de definir como ativo
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play()
          .then(() => {
            setCameraActive(true);
          })
          .catch(err => {
            console.error('Erro ao reproduzir vídeo:', err);
            setError('Não foi possível iniciar o vídeo. Tente recarregar a página.');
          });
      };
    } catch (err) {
      console.error('Erro detalhado ao acessar a câmera:', err);
      
      // Mensagens de erro específicas baseadas no tipo de erro
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Acesso à câmera negado. Por favor, permita o acesso à câmera quando solicitado.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('Nenhuma câmera encontrada no dispositivo.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Sua câmera pode estar sendo usada por outro aplicativo.');
      } else if (err.name === 'OverconstrainedError') {
        setError('Não foi possível encontrar uma câmera que atenda aos requisitos.');
      } else if (err.name === 'TypeError' || err.name === 'TypeError [ERR_INVALID_ARG_TYPE]') {
        setError('Erro de tipo ao acessar a câmera. Verifique as permissões do site.');
      } else {
        setError(`Erro ao acessar a câmera: ${err.message || 'Erro desconhecido'}`);
      }
    }
  };

  // Tirar foto com verificação aprimorada
  const takePhoto = () => {
    if (!videoRef.current) {
      setError('Referência de vídeo não disponível');
      return;
    }
    
    if (!videoRef.current.videoWidth) {
      setError('Stream de vídeo não está pronto. Por favor, aguarde um momento.');
      return;
    }

    try {
      const canvas = photoCanvasRef.current;
      const context = canvas.getContext('2d');
      
      // Definir dimensões do canvas para corresponder ao vídeo
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      // Desenhar frame atual do vídeo no canvas
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Converter para URL de dados
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      if (!dataUrl || dataUrl === 'data:,') {
        throw new Error('Falha ao capturar imagem da câmera');
      }
      
      setImageData(dataUrl);
      setPhotoTaken(true);
      
      // Parar a câmera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    } catch (err) {
      console.error('Erro ao tirar foto:', err);
      setError(`Falha ao capturar imagem: ${err.message}`);
    }
  };

  // Componente de status da câmera para debug
  const CameraStatus = () => (
    <div className="camera-status">
      <p>Status da câmera: <span>{cameraActive ? 'Ativa' : 'Inativa'}</span></p>
      <p>Permissão: <span>{cameraPermission || 'não solicitada'}</span></p>
    </div>
  );

// Função auxiliar para converter base64 em Blob
function base64ToBlob(base64, mime = 'image/jpeg') {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteArrays = [];

  for (let i = 0; i < byteCharacters.length; i += 512) {
    const slice = byteCharacters.slice(i, i + 512);
    const byteNumbers = new Array(slice.length);
    for (let j = 0; j < slice.length; j++) {
      byteNumbers[j] = slice.charCodeAt(j);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }

  return new Blob(byteArrays, { type: mime });
}

const processImage = async () => {
  if (!imageData) {
    setError('Nenhuma imagem disponível para processar');
    return;
  }

  setProcessing(true);
  setError('');

  try {
    // Converter base64 para Blob (sem usar fetch)
    const blob = base64ToBlob(imageData, 'image/jpeg');

    // Criar FormData com a imagem
    const formData = new FormData();
    formData.append('file', blob, 'cupom.jpg');

    // Enviar imagem para a API
    const response = await fetch('http://lagoinhasm-ocrrr.qwyqnc.easypanel.host/extrair-valor/?debug=false', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();

    // Verificar resposta da API com "valor_total"
    if (data && data.valor_total !== undefined) {
      setResult({
        valor: typeof data.valor_total === 'number'
          ? data.valor_total.toFixed(2).replace('.', ',')
          : data.valor_total,
        detalhes: {
          data: new Date().toLocaleDateString('pt-BR'),
          estabelecimento: data.estabelecimento || 'Não identificado',
        }
      });
    } else {
      throw new Error('A API não retornou um valor_total válido');
    }

  } catch (err) {
    console.error('Erro ao processar o cupom:', err);
    setError(`Falha ao processar o cupom: ${err.message}`);
  } finally {
    setProcessing(false);
  }
};
  return (
    <div className="app-container">
      <div className="scanner-container">
        <h1>Escaneador de Cupom Fiscal</h1>
        
        {process.env.NODE_ENV === 'development' && <CameraStatus />}
        
        <div className="camera-preview">
          {!photoTaken && (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className={`camera-feed ${cameraActive ? 'active' : 'inactive'}`}
            />
          )}
          
          {photoTaken && imageData && (
            <img 
              src={imageData} 
              alt="Preview da foto do cupom" 
              className="photo-preview" 
            />
          )}
          
          {!cameraActive && !photoTaken && !error && (
            <div className="camera-placeholder">
              <p>Clique em "Iniciar Câmera" para começar</p>
            </div>
          )}
          
          <canvas ref={photoCanvasRef} style={{ display: 'none' }} />
        </div>
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button 
              className="secondary-button error-action" 
              onClick={() => setError('')}
            >
              Fechar
            </button>
          </div>
        )}
        
        <div className="controls">
          {!cameraActive && !photoTaken && (
            <button className="action-button" onClick={startCamera}>
              Iniciar Câmera
            </button>
          )}
          
          {cameraActive && !photoTaken && (
            <button className="action-button" onClick={takePhoto}>
              Tirar Foto
            </button>
          )}
          
          {photoTaken && !result && (
            <div className="button-group">
              <button 
                className="action-button" 
                onClick={processImage}
                disabled={processing}
              >
                {processing ? 'Processando...' : 'Processar Cupom'}
              </button>
              <button 
                className="secondary-button" 
                onClick={() => {
                  setPhotoTaken(false);
                  setCameraActive(false);
                  setImageData(null);
                  startCamera();
                }} 
                disabled={processing}
              >
                Nova Foto
              </button>
            </div>
          )}
          
          {result && (
            <button className="secondary-button" onClick={() => {
              setPhotoTaken(false);
              setCameraActive(false);
              setResult(null);
              setImageData(null);
              setError('');
            }}>
              Escanear Novo Cupom
            </button>
          )}
        </div>
        
        {processing && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Processando o cupom...</p>
          </div>
        )}
        
        {result && (
          <div className="result">
            <h3>Resultado:</h3>
            <p>Valor do cupom: <strong>R$ {result.valor || '0,00'}</strong></p>
            {result.detalhes && (
              <div className="receipt-details">
                <p>Data: {result.detalhes.data}</p>
                <p>Estabelecimento: {result.detalhes.estabelecimento}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
export default App;