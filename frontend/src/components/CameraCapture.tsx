import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import { Close, Camera, FlipCameraIos, Replay } from '@mui/icons-material';

interface CameraCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (image: string) => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ open, onClose, onCapture }) => {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
    }
  }, [webcamRef]);

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleUseImage = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
      setCapturedImage(null);
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Capture Clinical Photo</Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, bgcolor: 'black', minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {capturedImage ? (
          <img src={capturedImage} alt="Captured" style={{ width: '100%', height: 'auto' }} />
        ) : (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode }}
            style={{ width: '100%', height: 'auto' }}
          />
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 2 }}>
        {!capturedImage ? (
          <>
            <Button
              variant="outlined"
              startIcon={<FlipCameraIos />}
              onClick={toggleFacingMode}
              sx={{ borderRadius: 3 }}
            >
              Flip
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Camera />}
              onClick={capture}
              sx={{ borderRadius: 10, px: 4, py: 1.5 }}
            >
              Capture
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outlined"
              startIcon={<Replay />}
              onClick={handleRetake}
              sx={{ borderRadius: 3 }}
            >
              Retake
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleUseImage}
              sx={{ borderRadius: 3, px: 4 }}
            >
              Use This Photo
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CameraCapture;
