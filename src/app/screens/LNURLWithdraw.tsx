import ConfirmOrCancel from "@components/ConfirmOrCancel";
import PublisherCard from "@components/PublisherCard";
import SuccessMessage from "@components/SuccessMessage";
import Input from "@components/form/Input";
import axios from "axios";
import { useState, MouseEvent } from "react";
import { USER_REJECTED_ERROR } from "~/common/constants";
import api from "~/common/lib/api";
import msg from "~/common/lib/msg";
import getOriginData from "~/extension/content-script/originData";
import type { LNURLWithdrawServiceResponse } from "~/types";

type Props = {
  details: LNURLWithdrawServiceResponse;
  origin?: {
    name: string;
    icon: string;
  };
};

function LNURLWithdraw(props: Props) {
  const [origin] = useState(props.origin || getOriginData());

  const { minWithdrawable, maxWithdrawable } = props.details;
  const [valueSat, setValueSat] = useState(
    (maxWithdrawable && (+maxWithdrawable / 1000).toString()) || ""
  );
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function confirm() {
    try {
      setErrorMessage("");
      setLoadingConfirm(true);
      const invoice = await api.makeInvoice({
        amount: parseInt(valueSat),
        memo: props.details.defaultDescription,
      });

      await axios.get(props.details.callback, {
        params: {
          k1: props.details.k1,
          pr: invoice.paymentRequest,
        },
      });

      setSuccessMessage("Withdraw request sent successfully.");
    } catch (e) {
      console.error(e);
      if (e instanceof Error) {
        setErrorMessage(e.message);
      }
    } finally {
      setLoadingConfirm(false);
    }
  }

  function renderAmount() {
    if (minWithdrawable === maxWithdrawable) {
      return <p>{`${minWithdrawable / 1000} sats`}</p>;
    } else {
      return (
        <div className="mt-1 flex flex-col">
          <Input
            type="number"
            min={minWithdrawable / 1000}
            max={maxWithdrawable / 1000}
            value={valueSat}
            onChange={(e) => setValueSat(e.target.value)}
          />
          {errorMessage && <p className="mt-1 text-red-500">{errorMessage}</p>}
        </div>
      );
    }
  }

  function reject(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    msg.error(USER_REJECTED_ERROR);
  }

  return (
    <div className="h-full flex flex-col">
      <div className="text-center text-xl font-semibold dark:text-white py-2 border-b border-gray-200 dark:border-neutral-500">
        Withdraw
      </div>
      {!successMessage ? (
        <div className="h-full flex flex-col justify-between">
          <div>
            <PublisherCard title={origin.name} image={origin.icon} />
            <dl className="m-4 shadow bg-white dark:bg-surface-02dp p-4 rounded-lg overflow-hidden">
              <dt className="font-medium mb-1 dark:text-white">
                Amount (Satoshi)
              </dt>
              <dd className="text-gray-500 dark:text-gray-400">
                {renderAmount()}
              </dd>
            </dl>
          </div>
          <ConfirmOrCancel
            disabled={loadingConfirm || !valueSat}
            loading={loadingConfirm}
            onConfirm={confirm}
            onCancel={reject}
          />
        </div>
      ) : (
        <>
          <PublisherCard title={origin.name} image={origin.icon} />
          <div className="m-4">
            <SuccessMessage
              message={successMessage}
              onClose={() => window.close()}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default LNURLWithdraw;
