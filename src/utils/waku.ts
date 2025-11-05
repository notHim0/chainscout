"use client";

import {
  DecodedMessage,
  LightNode,
  createDecoder,
  createEncoder,
  createLightNode,
  waitForRemotePeer,
} from "@waku/sdk";
import protobuf from "protobufjs";

const contentTopic = "/chainscout/1/chat/proto";

export const PChatMessage = new protobuf.Type("ChatMessage")
  .add(new protobuf.Field("timestamp", 1, "uint64"))
  .add(new protobuf.Field("message", 2, "string"));

export interface IChatMessage {
  timestamp: Date;
  message: string;
}

// Use 'as any' to bypass strict type checking temporarily
const encoder = createEncoder({
  contentTopic,
  ephemeral: false,
} as any);

const decoder = createDecoder(contentTopic);

export const createNode = async () => {
  try {
    const waku = await createLightNode({
      defaultBootstrap: true,
    });

    await waitForRemotePeer(waku, {
      timeoutMs: 15000,
    });

    return waku;
  } catch (error) {
    console.error("Failed to create Waku node:", error);
    throw error;
  }
};

export const receiveMessages = async (
  waku: LightNode,
  callback: (chatMessage: IChatMessage) => void
) => {
  const _callback = (wakuMessage: DecodedMessage): void => {
    if (!wakuMessage.payload) return;
    try {
      const pollMessageObj = PChatMessage.decode(wakuMessage.payload);
      const pollMessage = pollMessageObj.toJSON() as IChatMessage;
      callback(pollMessage);
    } catch (error) {
      console.error("Error decoding message:", error);
    }
  };

  try {
    // @ts-ignore - Bypass type checking for decoder
    const unsubscribe = await waku.filter.subscribe([decoder], _callback);
    return unsubscribe;
  } catch (error) {
    console.error("Error subscribing to messages:", error);
    throw error;
  }
};

export const sendMessages = async (
  waku: LightNode,
  chatMessage: IChatMessage
) => {
  const protoMessage = PChatMessage.create({
    timestamp: chatMessage.timestamp,
    message: chatMessage.message,
  });

  const serialisedMessage = PChatMessage.encode(protoMessage).finish();

  try {
    // @ts-ignore
    await waku.lightPush.send(encoder, {
      payload: serialisedMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const retrieveExistingMessages = async (
  waku: LightNode,
  callback: (chatMessage: IChatMessage) => void
) => {
  const _callback = (wakuMessage: DecodedMessage): void => {
    if (!wakuMessage.payload) return;
    try {
      const pollMessageObj = PChatMessage.decode(wakuMessage.payload);
      const pollMessage = pollMessageObj.toJSON() as IChatMessage;
      callback(pollMessage);
    } catch (error) {
      console.error("Error decoding stored message:", error);
    }
  };

  try {
    // @ts-ignore
    await waku.store.queryWithOrderedCallback([decoder], _callback);
  } catch (error) {
    console.error("Error retrieving existing messages:", error);
    throw error;
  }
};
