/*
Copyright (c) 2020 Cisco and/or its affiliates.

This software is licensed to you under the terms of the Cisco Sample
Code License, Version 1.1 (the "License"). You may obtain a copy of the
License at

               https://developer.cisco.com/docs/licenses

All use of the material herein must be in accordance with the terms of
the License. All rights not expressly granted by the License are
reserved. Unless required by applicable law or agreed to separately in
writing, software distributed under the License is distributed on an "AS
IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
or implied.
*/

import xapi from 'xapi';

// Adjust the following constants accordingly
const NEAR_MICROPHONE_CONNECTOR = 6;
const REMOTE_MICROPHONE_CONNECTOR = 3;
const NEAR_CAMERA_POSITION = 2;
const REMOTE_CAMERA_POSITION = 1;
const MICROPHONELOW  = 35;
const HIT_THRESHOLD = 50;

// Do not change the below constants / variables, used in runtime logic
const START_PANEL_ID = "ptz-start";
const STOP_PANEL_ID = "ptz-stop";
var NEAR_MICROPHONE_VU = 0;
var REMOTE_MICROPHONE_VU = 0;
var CURRENT = "near";
var HIT = 0;
var mic = null;

// Panel Action Buttons
const START_PANEL = `
  <Extensions>
    <Version>1.8</Version>
    <Panel>
      <ActivityType>Custom</ActivityType>
      <Color>#D43B52</Color>
      <Icon>Helpdesk</Icon>
      <Order>1</Order>
      <PanelId>${START_PANEL_ID}</PanelId>
      <Origin>global</Origin>
      <Name>Speaker Track</Name>
      <Type>Statusbar</Type>
    </Panel>
</Extensions>`;

const STOP_PANEL = `
  <Extensions>
    <Version>1.8</Version>
    <Panel>
      <ActivityType>Custom</ActivityType>
      <Color>#008094</Color>
      <Icon>Helpdesk</Icon>
      <Order>1</Order>
      <PanelId>${STOP_PANEL_ID}</PanelId>
      <Origin>global</Origin>
      <Name>Speaker Track</Name>
      <Type>Statusbar</Type>
    </Panel>
</Extensions>`;

// Event listener for Action Button
xapi.Event.UserInterface.Extensions.Panel.Clicked.on((event) => {
  if(event.PanelId == START_PANEL_ID){
    start_speaker_track();
  }else if(event.PanelId == STOP_PANEL_ID){
    stop_speaker_track();
  }
});

// Start speaker track
function start_speaker_track(){
  xapi.Command.Audio.VuMeter.Start({ ConnectorId: NEAR_MICROPHONE_CONNECTOR, ConnectorType: "Microphone" });
  xapi.Command.Audio.VuMeter.Start({ ConnectorId: REMOTE_MICROPHONE_CONNECTOR, ConnectorType: "Microphone" });
  mic = xapi.event.on('Audio Input Connectors Microphone', (event) => {
    if(event.id == REMOTE_MICROPHONE_CONNECTOR){
      REMOTE_MICROPHONE_VU = event.VuMeter;
    }else if(event.id == NEAR_MICROPHONE_CONNECTOR){
      NEAR_MICROPHONE_VU = event.VuMeter;
    }
    compare_vu();
  });
  xapi.Command.UserInterface.Extensions.Panel.Remove({ PanelId: START_PANEL_ID });
  xapi.Command.UserInterface.Extensions.Panel.Save({ PanelId: STOP_PANEL_ID }, STOP_PANEL);
  xapi.Command.UserInterface.Message.Alert.Display({ Duration: 5, Text: "Speaker Track is on" });
}

function stop_speaker_track(){
  if(mic != null){
    mic();
  }
  xapi.Command.UserInterface.Extensions.Panel.Remove({ PanelId: STOP_PANEL_ID });
  xapi.Command.UserInterface.Extensions.Panel.Save({ PanelId: START_PANEL_ID }, START_PANEL);
  xapi.Command.UserInterface.Message.Alert.Display({ Duration: 5, Text: "Speaker Track is off" });
}

function compare_vu(){
  if(NEAR_MICROPHONE_VU != 0 && REMOTE_MICROPHONE_VU != 0){
    if(NEAR_MICROPHONE_VU > REMOTE_MICROPHONE_VU){
      if(CURRENT == "near" && NEAR_MICROPHONE_VU >= MICROPHONELOW){
        HIT += 1;
      }else{
        CURRENT = "near";
        HIT = 0;
      }
      if(HIT >= HIT_THRESHOLD){
        xapi.Command.Camera.Preset.Activate({ PresetId: NEAR_CAMERA_POSITION});
      }
    }else if(NEAR_MICROPHONE_VU < REMOTE_MICROPHONE_VU){
      if(CURRENT == "remote" && REMOTE_MICROPHONE_VU >= MICROPHONELOW){
        HIT += 1;
      }else{
        CURRENT = "remote";
        HIT = 0;
      }
      if(HIT >= HIT_THRESHOLD){
        xapi.Command.Camera.Preset.Activate({ PresetId: REMOTE_CAMERA_POSITION});
      }
    }
  }
  // Logs to see different metrics
  /*console.log(`NEAR_MICROPHONE_VU: ${NEAR_MICROPHONE_VU}`);
  console.log(`REMOTE_MICROPHONE_VU: ${REMOTE_MICROPHONE_VU}`);
  console.log(`CURRENT: ${CURRENT}`);
  console.log(`HIT: ${HIT}`);*/
}
