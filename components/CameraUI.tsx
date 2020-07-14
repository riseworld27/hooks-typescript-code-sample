import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, AsyncStorage, ViewStyle } from 'react-native';
import {
  Modal,
  Portal,
  IconButton,
  Colors,
  Snackbar,
  Text,
  ActivityIndicator,
  useTheme
} from 'react-native-paper';
import { Camera } from 'expo-camera';
import { Guid } from 'guid-typescript';
import { IImage } from '../types';
import { defaultStyles, ThemeColors } from '../util/theme';
import * as Location from 'expo-location';
import useMounted from '../util/useMounted';
import { copyPhotoFromCache } from '../util/files';
import * as MediaLibrary from 'expo-media-library';

const largeIconBase: Partial<ViewStyle> = {
  position: 'absolute',
  borderRadius: 100,
  width: 72,
  height: 72
};

const smallIconBase: Partial<ViewStyle> = {
  borderRadius: 50,
  width: 48,
  height: 48,
  backgroundColor: '#fff',
  marginLeft: 10
};

const styles = StyleSheet.create({
  takePhoto: {
    bottom: 50,
    right: 30,
    backgroundColor: Colors.blue600,
    ...largeIconBase
  },
  cancelPhoto: {
    top: 40,
    left: 30,
    backgroundColor: Colors.yellow700,
    ...largeIconBase
  },
  settingsCt: {
    position: 'absolute',
    top: 40,
    right: 30,
    flexDirection: 'row'
  },
  frontOrBack: {
    ...smallIconBase
  },
  activity: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

const savedMessage = 'Photo saved';
const errorMessage = 'Unable to save photo';

interface ISnackOptions {
  visible: boolean;
  message: string;
  color?: string;
}

enum FlashMode {
  Auto = 'auto',
  On = 'on',
  Off = 'off'
}

interface ICameraUIProps {
  onTakePicture: (photo: IImage) => void;
  onClose: () => void;
  usesLocation: boolean;
}

const FRONT_KEY = 'CAMERA_FRONT';
const FLASH_KEY = 'CAMERA_FLASH';

const flashToEnum = (s: string) => {
  switch (s) {
    case 'auto':
      return FlashMode.Auto;
    case 'on':
      return FlashMode.On;
    case 'off':
      return FlashMode.Off;
    default:
      return FlashMode.Auto;
  }
};

const getFlashIcon = (mode: FlashMode) => {
  switch (mode) {
    case FlashMode.Auto:
      return 'flash-auto';
    case FlashMode.On:
      return 'flash';
    case FlashMode.Off:
      return 'flash-off';
  }
  throw new Error('');
};

const modes = [FlashMode.Auto, FlashMode.On, FlashMode.Off];

const CameraUI: React.FunctionComponent<ICameraUIProps> = ({
  onTakePicture,
  onClose,
  usesLocation
}: ICameraUIProps) => {
  const [buutonsDisabled, setButtonsDisabled] = useState(false);
  const [snackOptions, setSnackOptions] = useState<ISnackOptions>({
    visible: false,
    message: ''
  });
  const camera = useRef<Camera>(null);
  const mounted = useMounted();
  const { colors } = useTheme();
  const [cameraFront, setCameraFront] = useState(false);
  // TODO: there's no way to detect whether flash is available on the device.
  // In the future we should see if this is changed.
  const [flashMode, setFlashMode] = useState(FlashMode.Auto);

  const checkInitialFront = async () => {
    const state = await AsyncStorage.getItem(FRONT_KEY);
    setCameraFront(state === 'front');
  };

  const checkInitialFlash = async () => {
    const state = await AsyncStorage.getItem(FLASH_KEY);
    setFlashMode(flashToEnum(state || 'auto'));
  };

  useEffect(() => {
    void checkInitialFront();
  }, []);

  useEffect(() => {
    void checkInitialFlash();
  }, []);

  const toggleFront = async () => {
    const front = !cameraFront;
    setCameraFront(front);
    await AsyncStorage.setItem(FRONT_KEY, front ? 'front' : 'back');
  };

  const toggleFlash = async () => {
    const mode = modes[(modes.indexOf(flashMode) + 1) % modes.length];
    setFlashMode(mode);
    await AsyncStorage.setItem(FLASH_KEY, mode.toString());
  };

  const handleSnackDismiss = () => {
    closeSnack();
  };

  const closeSnack = () => {
    if (!mounted.current) {
      return;
    }
    setSnackOptions(prev => ({
      ...prev,
      visible: false
    }));
  };

  const showSnack = (message: string, color?: string) => {
    setSnackOptions({
      visible: true,
      color,
      message
    });
  };

  const handleTakePhoto = async () => {
    if (!camera.current) {
      return;
    }
    handleSnackDismiss();
    setButtonsDisabled(true);
    try {
      const { width, height, uri } = await camera.current.takePictureAsync({
        quality: 0.5
      });

      const savedUri = await copyPhotoFromCache(uri);
      await MediaLibrary.saveToLibraryAsync(uri);

      const photoData: IImage = {
        isImage: true,
        id: Guid.create().toString(),
        uri: savedUri,
        timestamp: Date.now(),
        dimensions: {
          width,
          height
        }
      };
      if (usesLocation) {
        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            enableHighAccuracy: false
          });
          photoData.geo = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            altitude: loc.coords.altitude
          };
        } catch (e) {
          // no can do
        }
      }
      onTakePicture(photoData);
      setButtonsDisabled(false);
      showSnack(savedMessage);
    } catch (ex) {
      setButtonsDisabled(false);
      showSnack(errorMessage, ThemeColors.error);
    }
  };

  // TODO: Want to be able to detect device rotation without allowing landscape.
  // See: https://github.com/expo/expo/issues/2430
  return (
    <Portal>
      <Modal visible={true}>
        <Camera
          style={defaultStyles.full}
          ref={camera}
          type={cameraFront ? 'front' : 'back'}
          flashMode={flashMode.toString()}
        />
        {buutonsDisabled ? (
          <View style={styles.activity}>
            <ActivityIndicator
              animating={true}
              color={colors.accent}
              size="large"
            />
          </View>
        ) : null}
        <IconButton
          icon="close"
          style={styles.cancelPhoto}
          size={64}
          disabled={buutonsDisabled}
          onPress={onClose}
        />
        <IconButton
          icon="camera-outline"
          style={styles.takePhoto}
          size={64}
          disabled={buutonsDisabled}
          onPress={() => {
            void handleTakePhoto();
          }}
        />
        <View style={styles.settingsCt}>
          <IconButton
            style={styles.frontOrBack}
            icon={cameraFront ? 'camera-rear' : 'camera-front'}
            onPress={() => {
              void toggleFront();
            }}
          />
          <IconButton
            style={styles.frontOrBack}
            icon={getFlashIcon(flashMode)}
            onPress={() => {
              void toggleFlash();
            }}
          />
        </View>
        <Snackbar
          visible={snackOptions.visible}
          onDismiss={handleSnackDismiss}
          duration={Snackbar.DURATION_SHORT}
        >
          <Text
            style={{
              color: snackOptions.color
            }}
          >
            {snackOptions.message}
          </Text>
        </Snackbar>
      </Modal>
    </Portal>
  );
};

export default CameraUI;
