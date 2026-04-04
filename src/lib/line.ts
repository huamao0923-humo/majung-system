import { messagingApi } from "@line/bot-sdk";

function getClientForToken(token?: string | null) {
  if (!token) {
    console.warn("LINE Messaging API token not configured");
    return null;
  }
  return new messagingApi.MessagingApiClient({ channelAccessToken: token });
}

export async function sendLineMessage(
  userId: string,
  messages: messagingApi.Message[],
  token?: string | null
) {
  const c = getClientForToken(token ?? process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN);
  if (!c) {
    return;
  }
  try {
    await c.pushMessage({ to: userId, messages });
  } catch (err) {
    console.error("Failed to send LINE message:", err);
  }
}

export function reservationConfirmedMessage(data: {
  displayName: string;
  date: string;
  timeSlotName: string;
  tableName: string;
  guestCount: number;
}): messagingApi.Message {
  return {
    type: "flex",
    altText: `預約確認 - ${data.date} ${data.timeSlotName}`,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [{ type: "text", text: "🀄 麻將館預約確認", weight: "bold", color: "#ffffff", size: "lg" }],
        backgroundColor: "#C0392B",
        paddingAll: "16px",
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          { type: "text", text: `您好，${data.displayName}！`, weight: "bold", size: "md" },
          { type: "separator" },
          {
            type: "box", layout: "vertical", spacing: "sm",
            contents: [
              { type: "box", layout: "horizontal", contents: [
                { type: "text", text: "日期", color: "#888888", size: "sm", flex: 2 },
                { type: "text", text: data.date, size: "sm", flex: 3 }
              ]},
              { type: "box", layout: "horizontal", contents: [
                { type: "text", text: "時段", color: "#888888", size: "sm", flex: 2 },
                { type: "text", text: data.timeSlotName, size: "sm", flex: 3 }
              ]},
              { type: "box", layout: "horizontal", contents: [
                { type: "text", text: "桌位", color: "#888888", size: "sm", flex: 2 },
                { type: "text", text: data.tableName, size: "sm", flex: 3 }
              ]},
              { type: "box", layout: "horizontal", contents: [
                { type: "text", text: "人數", color: "#888888", size: "sm", flex: 2 },
                { type: "text", text: `${data.guestCount} 人`, size: "sm", flex: 3 }
              ]},
            ]
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [{ type: "text", text: "請準時到場，謝謝！", color: "#888888", size: "sm", align: "center" }]
      }
    }
  };
}

export function paymentConfirmedMessage(data: {
  displayName: string;
  amount: number;
  method: string;
}): messagingApi.Message {
  return {
    type: "text",
    text: `✅ 繳費確認\n\n您好，${data.displayName}！\n金額：NT$ ${data.amount}\n方式：${data.method}\n\n感謝您的光臨！`,
  };
}

export function cancelledMessage(data: {
  displayName: string;
  date: string;
  timeSlotName: string;
}): messagingApi.Message {
  return {
    type: "text",
    text: `❌ 預約取消通知\n\n您好，${data.displayName}！\n您 ${data.date} ${data.timeSlotName} 的預約已被取消。\n\n如有疑問請聯繫我們。`,
  };
}

export function waitlistAvailableMessage(data: {
  displayName: string;
  date: string;
  timeSlotName: string;
}): messagingApi.Message {
  return {
    type: "text",
    text: `🔔 候補通知\n\n您好，${data.displayName}！\n${data.date} ${data.timeSlotName} 有桌位釋出，請盡快至系統完成預約！\n（名額有限，先搶先得）`,
  };
}

export function checkinReminderMessage(data: {
  displayName: string;
  date: string;
  timeSlotName: string;
  tableName: string;
}): messagingApi.Message {
  return {
    type: "text",
    text: `⏰ 入場提醒\n\n您好，${data.displayName}！\n您今天 ${data.timeSlotName} 於 ${data.tableName} 的預約即將開始，請準時到場！`,
  };
}
