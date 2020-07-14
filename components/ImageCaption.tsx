import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  TouchableWithoutFeedback,
  StyleProp,
  ViewStyle,
  Dimensions
} from 'react-native';
import { Nullable, IUri } from '../types';
import ImagePreview from './ImagePreview';
import { getSizeCached, ISize } from '../util/image';

interface IImageCaptionProps {
  images: IUri[];
  style: StyleProp<ViewStyle>;
}

const sizeDefault = 200;
const halfScreenHeightPx = Dimensions.get('window').height / 2;

const ImageCaption: React.FunctionComponent<IImageCaptionProps> = ({
  images,
  style
}: IImageCaptionProps) => {
  const [previewIndex, setPreviewIndex] = useState<Nullable<number>>(null);
  const [previewSize, setPreviewSize] = useState<ISize | null>(null);

  const showPreview = () => {
    setPreviewIndex(0);
  };

  const hidePreview = () => {
    setPreviewIndex(null);
  };

  useEffect(() => {
    async function check() {
      const size = await getSizeCached(images[0].uri);
      setPreviewSize(size);
    }
    check();
  }, []);

  return (
    <View style={style}>
      <ImagePreview
        imageIndex={previewIndex}
        images={images}
        onCancel={hidePreview}
      />
      <TouchableWithoutFeedback
        onPress={showPreview}
        accessibilityTraits="button"
        accessibilityComponentType="button"
      >
        <Image
          resizeMode="contain"
          style={{
            height: Math.min(
              halfScreenHeightPx,
              previewSize ? previewSize.height : sizeDefault
            )
          }}
          source={{
            uri: images[0].uri
          }}
        />
      </TouchableWithoutFeedback>
    </View>
  );
};

export default ImageCaption;
