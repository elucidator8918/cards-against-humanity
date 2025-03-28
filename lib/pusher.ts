import PusherServer from "pusher"
import PusherClient from "pusher-js"

export const pusherServer = new PusherServer({
  appId: "1964075",
  key: "c7cb04e98215a4614135",
  secret: "996864943ab030ebc875",
  cluster: "ap2",
  useTLS: true,
})

export const pusherClient = new PusherClient("c7cb04e98215a4614135", {
  cluster: "ap2",
})

