import { DialogAppSDK } from "@contentful/app-sdk";
import { useCMA, useSDK } from "@contentful/react-apps-toolkit";
import { useEffect, useState } from "react";
import tokens from "@contentful/f36-tokens";
import FilerobotImageEditor, { TABS } from "react-filerobot-image-editor";
import { css } from "emotion";

import { AssetProps } from "contentful-management";

interface IDialogParameters {
  assetId?: string;
  locale?: string;
}

interface ISavedImageData {
  name: string;
  extension: string;
  mimeType: string;
  fullName?: string;
  height?: number;
  width?: number;
  imageBase64?: string;
  imageCanvas?: HTMLCanvasElement;
  quality?: number;
  cloudimageUrl?: string;
}

const contentfulTheme: Object = {
  palette: {
    "bg-secondary": tokens.colorWhite,
    "bg-primary": tokens.gray100,
    "bg-primary-active": tokens.gray200,
    "accent-primary": tokens.colorPrimary,
    "accent-primary-active": tokens.colorBlack,
    "icons-primary": tokens.colorPrimary,
    "icons-secondary": tokens.gray100,
    "borders-secondary": tokens.gray100,
    "borders-primary": tokens.gray200,
    "borders-strong": tokens.gray400,
    "light-shadow": tokens.gray100,
    warning: tokens.colorWarning,
  },
  typography: {
    fontFamily:
      "-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbo",
  },
};

const tabIds: Record<string, any> = {
  adjustTab: TABS.ADJUST,
  filtersTab: TABS.FILTERS,
  fineTuneTab: TABS.FINETUNE,
  resizeTab: TABS.RESIZE,
  annotateTab: TABS.ANNOTATE,
  watermarkTab: TABS.WATERMARK,
};

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const length = binaryString.length;
  const bytes = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes.buffer;
}

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  const [image, setImage] = useState<AssetProps | undefined>(undefined);

  const cma = useCMA();

  const { assetId, locale = sdk.locales.default } = sdk.parameters
    .invocation as IDialogParameters;
  const fallbackLocale = sdk.locales.fallbacks[locale] || sdk.locales.default;

  const enabledTabs = Object.entries(sdk.parameters.installation)
    ?.filter(([key, value]) => value)
    ?.map(([key]) => tabIds[key]);

  useEffect(() => {
    const fetchAsset = async () => {
      if (assetId) {
        const asset = await cma.asset.get({ assetId });
        setImage(asset);
      }
    };
    sdk.window.startAutoResizer();
    fetchAsset();
  }, []);

  const saveImage = async (savedImageData: ISavedImageData) => {
    const base64Image = savedImageData.imageBase64?.split(",")?.[1];

    if (image && base64Image && savedImageData.mimeType) {
      let asset = await cma.asset.get({
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        assetId: image.sys.id,
      });

      const upload = await cma.upload.create(
        { spaceId: sdk.ids.space, environmentId: sdk.ids.environment },
        { file: base64ToArrayBuffer(base64Image) }
      );

      const file = {
        fileName: image.fields.file[locale].fileName,
        contentType: savedImageData.mimeType,
        uploadFrom: {
          sys: {
            linkType: "Upload",
            type: "Link",
            id: upload.sys.id,
          },
        },
      };

      if (asset.fields.file[locale]) {
        asset.fields.file[locale] = { ...file };
      } else if (asset.fields.file[fallbackLocale]) {
        asset.fields.file[fallbackLocale] = { ...file };
      }

      const processLocale = asset.fields.file[locale] ? locale : fallbackLocale;

      asset = await cma.asset.update(
        { environmentId: sdk.ids.environment, assetId: asset.sys.id },
        asset
      );

      asset = await cma.asset.processForLocale(
        {
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environment,
          assetId: image.sys.id,
        },
        asset,
        processLocale
      );

      asset = await cma.asset.publish(
        { environmentId: sdk.ids.environment, assetId: asset.sys.id },
        asset
      );

      sdk.close({ error: false, message: "Image updated" });
    }
  };

  if (!image) {
    return null;
  }

  const imageUrl =
    image?.fields?.file?.[locale]?.url ||
    image?.fields?.file?.[fallbackLocale]?.url;

  if (!imageUrl) {
    sdk.close({ error: true, message: "No image found" });
    return null;
  }

  return (
    <div className={css({ height: "100vh" })}>
      <FilerobotImageEditor
        source={imageUrl}
        // @ts-ignore https://github.com/scaleflex/filerobot-image-editor/issues/338
        theme={contentfulTheme}
        onSave={saveImage}
        onBeforeSave={() => false}
        Rotate={{ angle: 90, componentType: "slider" }}
        tabsIds={enabledTabs}
        defaultTabId={enabledTabs[0]}
        savingPixelRatio={4}
        previewPixelRatio={window.devicePixelRatio}
        forceToPngInEllipticalCrop
      />
    </div>
  );
};

export default Dialog;
