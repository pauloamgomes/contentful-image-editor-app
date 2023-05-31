import { ConfigAppSDK } from "@contentful/app-sdk";
import {
  Flex,
  Form,
  Heading,
  Paragraph,
  Switch,
  TextLink,
} from "@contentful/f36-components";
import { ExternalLinkIcon } from "@contentful/f36-icons";
import { useSDK } from "@contentful/react-apps-toolkit";
import { css } from "emotion";
import { useCallback, useEffect, useState } from "react";

export interface AppInstallationParameters {
  adjustTab?: boolean;
  filtersTab?: boolean;
  fineTuneTab?: boolean;
  resizeTab?: boolean;
  annotateTab?: boolean;
  watermarkTab?: boolean;
}

const initialParameters: AppInstallationParameters = {
  adjustTab: true,
  filtersTab: true,
  fineTuneTab: true,
  resizeTab: true,
  annotateTab: true,
  watermarkTab: true,
};

const ConfigScreen = () => {
  const [parameters, setParameters] =
    useState<AppInstallationParameters>(initialParameters);
  const sdk = useSDK<ConfigAppSDK>();

  const onConfigure = useCallback(async () => {
    // This method will be called when a user clicks on "Install"
    // or "Save" in the configuration screen.
    // for more details see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#register-an-app-configuration-hook

    // Get current the state of EditorInterface and other entities
    // related to this app installation
    const currentState = await sdk.app.getCurrentState();

    return {
      // Parameters to be persisted as the app configuration.
      parameters,
      // In case you don't want to submit any update to app
      // locations, you can just pass the currentState as is
      targetState: currentState,
    };
  }, [parameters, sdk]);

  useEffect(() => {
    // `onConfigure` allows to configure a callback to be
    // invoked when a user attempts to install the app or update
    // its configuration.
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      // Get current parameters of the app.
      // If the app is not installed yet, `parameters` will be `null`.
      const currentParameters: AppInstallationParameters | null =
        await sdk.app.getParameters();

      if (currentParameters && "adjustTab" in currentParameters) {
        setParameters(currentParameters);
      } else {
        setParameters(initialParameters);
      }

      // Once preparation has finished, call `setReady` to hide
      // the loading screen and present the app to a user.
      sdk.app.setReady();
    })();
  }, [sdk]);

  return (
    <Flex
      flexDirection="column"
      className={css({ margin: "30px 80px", maxWidth: "800px" })}
    >
      <Form>
        <Heading>Configuration</Heading>
        <Paragraph>
          This App provides the ability to "edit" images directly from the Entry
          editor.
        </Paragraph>
        <Paragraph>
          It makes use of the{" "}
          <TextLink
            href="https://github.com/scaleflex/filerobot-image-editor"
            target="_blank"
            icon={<ExternalLinkIcon />}
            alignIcon="end"
          >
            Filerobot Image Editor package
          </TextLink>
          .
        </Paragraph>

        <Heading as="h2">Enable/Disable Image Editor Tabs</Heading>

        <Flex flexDirection="column" gap="spacingS">
          <Switch
            name="adjustTab"
            id="adjustTab"
            isChecked={parameters.adjustTab === true}
            onChange={() =>
              setParameters({
                ...parameters,
                adjustTab: !parameters.adjustTab,
              })
            }
          >
            Adjust Tab - Allows for basic image adjustments
          </Switch>

          <Switch
            name="filtersTab"
            id="filtersTab"
            isChecked={parameters.filtersTab === true}
            onChange={() =>
              setParameters({
                ...parameters,
                filtersTab: !parameters.filtersTab,
              })
            }
          >
            Filters Tab - Allows for applying filters to images
          </Switch>

          <Switch
            name="fineTuneTab"
            id="fineTuneTab"
            isChecked={parameters.fineTuneTab === true}
            onChange={() =>
              setParameters({
                ...parameters,
                fineTuneTab: !parameters.fineTuneTab,
              })
            }
          >
            Fine Tune Tab - Allows for fine tuning of images
          </Switch>

          <Switch
            name="resizeTab"
            id="resizeTab"
            isChecked={parameters.resizeTab === true}
            onChange={() =>
              setParameters({
                ...parameters,
                resizeTab: !parameters.resizeTab,
              })
            }
          >
            Resize Tab - Allows for resizing images
          </Switch>

          <Switch
            name="annotateTab"
            id="annotateTab"
            isChecked={parameters.annotateTab === true}
            onChange={() =>
              setParameters({
                ...parameters,
                annotateTab: !parameters.annotateTab,
              })
            }
          >
            Annotate Tab - Allows for adding annotations (text, arrows, shapes,
            etc..) to images
          </Switch>

          <Switch
            name="watermarkTab"
            id="watermarkTab"
            isChecked={parameters.watermarkTab === true}
            onChange={() =>
              setParameters({
                ...parameters,
                watermarkTab: !parameters.watermarkTab,
              })
            }
          >
            Watermark Tab - Allows for adding watermarks to images
          </Switch>
        </Flex>
      </Form>
    </Flex>
  );
};

export default ConfigScreen;
