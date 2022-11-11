import * as secp256k1 from "@noble/secp256k1";
import { decryptData, encryptData } from "~/common/lib/crypto";
import { Event } from "~/extension/ln/nostr/types";

import { signEvent } from "../actions/nostr/helpers";
import state from "../state";

class Nostr {
  async getPrivateKey() {
    const storageSessionPassword = await chrome.storage.session.get("password");
    const password = storageSessionPassword.password;
    const encryptedKey = state.getState().nostrPrivateKey as string;
    if (encryptedKey) {
      return decryptData(encryptedKey, password);
    }

    return null;
  }

  async getPublicKey() {
    const publicKey = secp256k1.schnorr.getPublicKey(
      secp256k1.utils.hexToBytes(await this.getPrivateKey())
    );
    const publicKeyHex = secp256k1.utils.bytesToHex(publicKey);
    return publicKeyHex;
  }

  async setPrivateKey(privateKey: string) {
    const storageSessionPassword = await chrome.storage.session.get("password");
    const password = storageSessionPassword.password;

    state.setState({ nostrPrivateKey: encryptData(privateKey, password) });
    await state.getState().saveToStorage();
  }

  async signEvent(event: Event): Promise<Event> {
    const signature = await signEvent(event, await this.getPrivateKey());
    event.sig = signature;
    return event;
  }
}

export default Nostr;
