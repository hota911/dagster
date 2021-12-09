import {useMutation} from '@apollo/client';
import * as React from 'react';

import {AppContext} from '../app/AppContext';
import {DISABLED_MESSAGE, usePermissions} from '../app/Permissions';
import {useTelemetryAction, TelemetryAction} from '../app/Telemetry';
import {LAUNCH_PIPELINE_EXECUTION_MUTATION, handleLaunchResult} from '../runs/RunUtils';
import {
  LaunchPipelineExecution,
  LaunchPipelineExecutionVariables,
} from '../runs/types/LaunchPipelineExecution';

import {LaunchButton} from './LaunchButton';
import {showLaunchError} from './showLaunchError';

interface LaunchRootExecutionButtonProps {
  disabled: boolean;
  getVariables: () => undefined | LaunchPipelineExecutionVariables;
  pipelineName: string;
}

export const LaunchRootExecutionButton: React.FunctionComponent<LaunchRootExecutionButtonProps> = (
  props,
) => {
  const logLaunch = useTelemetryAction(TelemetryAction.LAUNCH_RUN);
  const {canLaunchPipelineExecution} = usePermissions();
  const [launchPipelineExecution] = useMutation<LaunchPipelineExecution>(
    LAUNCH_PIPELINE_EXECUTION_MUTATION,
  );
  const {basePath} = React.useContext(AppContext);

  const onLaunch = async () => {
    const variables = props.getVariables();
    if (variables == null) {
      return;
    }

    const metadata: {[key: string]: string | null | undefined} = {};

    if (variables.executionParams.selector.solidSelection) {
      metadata['opSelection'] = 'provided';
    }
    metadata['jobName'] =
      variables.executionParams.selector.jobName || variables.executionParams.selector.pipelineName;

    try {
      const result = await launchPipelineExecution({variables});
      logLaunch(metadata);
      handleLaunchResult(basePath, props.pipelineName, result);
    } catch (error) {
      showLaunchError(error as Error);
    }
  };

  return (
    <LaunchButton
      runCount={1}
      config={{
        icon: 'open_in_new',
        onClick: onLaunch,
        title: 'Launch Run',
        disabled: props.disabled || !canLaunchPipelineExecution,
        tooltip: !canLaunchPipelineExecution ? DISABLED_MESSAGE : undefined,
      }}
    />
  );
};