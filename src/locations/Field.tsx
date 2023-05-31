import { FieldAppSDK } from "@contentful/app-sdk";
import { IconButton, ButtonGroup, Skeleton } from "@contentful/f36-components";
import {
  ImageIcon,
  CopyIcon,
  DownloadIcon,
  DeleteIcon,
} from "@contentful/f36-icons";
import tokens from "@contentful/f36-tokens";
import { useCMA, useSDK } from "@contentful/react-apps-toolkit";
import { SingleMediaEditor } from "@contentful/field-editor-reference";
import { useEffect, useState } from "react";
import { css } from "emotion";

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const cma = useCMA();
  const locale = sdk.field.locale;

  const [editing, setEditing] = useState(false);
  const [assetId, setAssetId] = useState(sdk.field.getValue()?.sys.id);
  const { showCreateEntityAction = true, showLinkEntityAction = true } =
    sdk.parameters.instance;

  const isImage =
    sdk.field.type === "Link" &&
    sdk.field.validations.some((v) => v.linkMimetypeGroup?.includes("image"));

  useEffect(() => {
    sdk.window.startAutoResizer();
    sdk.field.onValueChanged((value) => {
      setAssetId(value?.sys.id);
    });
  }, []);

  const openImageEditor = async () => {
    setEditing(true);
    const result = await sdk.dialogs.openCurrentApp({
      title: "Image Editor",
      allowHeightOverflow: true,
      width: "fullWidth",
      minHeight: "86vh",
      position: "center",
      parameters: {
        assetId,
        locale,
      },
    });

    if (result?.error === false) {
      sdk.notifier.success(result.message);
    } else if (result?.error === true) {
      sdk.notifier.error(result.message);
    }

    setEditing(false);
  };

  const downloadImage = async () => {
    const asset = await cma.asset.get({ assetId });
    const imageUrl = asset.fields.file[locale].url || "";
    const response = await fetch(`https:${imageUrl}`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = asset.fields.file[locale].fileName || "";
    anchor.click();

    URL.revokeObjectURL(url);
  };

  const copyUrl = async () => {
    const asset = await cma.asset.get({ assetId });
    const imageUrl = asset.fields.file[locale].url || "";

    navigator.clipboard.writeText(`https:${imageUrl}`);
    sdk.notifier.success("Image url copied to clipboard");
  };

  const removeImage = async () => {
    await sdk.field.removeValue();
  };

  if (!isImage) {
    return (
      <SingleMediaEditor
        viewType="card"
        sdk={sdk}
        parameters={{
          instance: {
            showCreateEntityAction,
            showLinkEntityAction,
          },
        }}
      />
    );
  }

  return (
    <div css={css({ height: "100%" })}>
      <div>
        {editing ? (
          <Skeleton.Container>
            <Skeleton.Image width={400} height={300} />
          </Skeleton.Container>
        ) : (
          <SingleMediaEditor
            viewType="card"
            sdk={sdk}
            parameters={{
              instance: {
                showCreateEntityAction,
                showLinkEntityAction,
              },
            }}
          />
        )}
      </div>
      {assetId ? (
        <ButtonGroup className={css({ marginTop: tokens.spacingS })}>
          <IconButton
            size="small"
            variant="secondary"
            aria-label="Image editor"
            icon={<ImageIcon />}
            onClick={openImageEditor}
          >
            Image editor
          </IconButton>
          <IconButton
            size="small"
            variant="secondary"
            aria-label="Copy Preview"
            icon={<CopyIcon />}
            onClick={copyUrl}
          >
            Copy Url
          </IconButton>
          <IconButton
            size="small"
            variant="secondary"
            aria-label="Download Image"
            icon={<DownloadIcon />}
            onClick={downloadImage}
          >
            Download
          </IconButton>
          <IconButton
            size="small"
            variant="secondary"
            aria-label="Remove Image"
            icon={<DeleteIcon />}
            onClick={removeImage}
          >
            Remove
          </IconButton>
        </ButtonGroup>
      ) : null}
    </div>
  );
};

export default Field;
