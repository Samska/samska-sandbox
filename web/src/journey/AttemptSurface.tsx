import { useEffect, useRef, useState } from "react";
import type { OrderResponse } from "../order/orderApi";
import OrderResult from "../order/OrderResult";
import PaymentResult from "../payment/PaymentResult";
import type { PaymentAttemptResponse } from "../payment/paymentApi";
import Button from "../ui/Button";
import StatusMessage from "../ui/StatusMessage";
import {
  abandonConfirmLabel,
  abandonWarning,
  checkingJourneyMessage,
  keepReferenceLabel,
  lookupFailedMessage,
  paymentInProgressNote,
  unavailableReferenceMessage,
  unavailableReferenceNote,
  unconfirmedPaymentPrimary
} from "./messages";

export type RecoveryStatus = "idle" | "checking" | "unavailable" | "error";

export default function AttemptSurface({
  attemptId,
  order,
  paymentAttempt,
  paymentPending,
  recoveryStatus,
  paymentUncertain,
  orderPending,
  orderError,
  orderUncertain,
  orderRetryReady,
  orderBlocked,
  onCreateOrder,
  onCheckOrder,
  onCheckPayment,
  onRetryRecovery,
  onAbandon,
  onBackToMarket,
  onBackToCheckout
}: {
  attemptId: string;
  order: OrderResponse | null;
  paymentAttempt: PaymentAttemptResponse | null;
  paymentPending: boolean;
  recoveryStatus: RecoveryStatus;
  paymentUncertain: boolean;
  orderPending: boolean;
  orderError: string | null;
  orderUncertain: boolean;
  orderRetryReady: boolean;
  orderBlocked: boolean;
  onCreateOrder: () => void;
  onCheckOrder: () => void;
  onCheckPayment: () => void;
  onRetryRecovery: () => void;
  onAbandon: () => void;
  onBackToMarket: () => void;
  onBackToCheckout: () => void;
}) {
  const orderForAttempt = order !== null && order.paymentAttemptId === attemptId ? order : null;
  const attempt = paymentAttempt !== null && paymentAttempt.attemptId === attemptId ? paymentAttempt : null;

  if (orderForAttempt !== null) {
    return (
      <OrderResult
        order={orderForAttempt}
        onBackToMarket={onBackToMarket}
        onBackToCheckout={onBackToCheckout}
      />
    );
  }

  if (attempt !== null) {
    return (
      <div className="grid min-w-0 gap-4">
        <PaymentResult
          attempt={attempt}
          onBackToCheckout={onBackToCheckout}
          onBackToMarket={onBackToMarket}
          onCreateOrder={attempt.status === "approved" ? onCreateOrder : undefined}
          onCheckOrder={orderUncertain ? onCheckOrder : undefined}
          orderPending={orderPending}
          orderError={orderError}
          orderUnconfirmed={orderUncertain}
          orderRetryReady={orderRetryReady}
          orderBlocked={orderBlocked}
        />
        {attempt.status === "approved" ? (
          <AbandonControl pending={orderPending} onAbandon={onAbandon} />
        ) : null}
      </div>
    );
  }

  if (paymentPending) {
    return (
      <AttemptPendingCard onBackToCheckout={onBackToCheckout} onBackToMarket={onBackToMarket} />
    );
  }

  return (
    <RecoveryCard
      recoveryStatus={recoveryStatus}
      paymentUncertain={paymentUncertain}
      onCheckPayment={onCheckPayment}
      onRetryRecovery={onRetryRecovery}
      onAbandon={onAbandon}
      onBackToCheckout={onBackToCheckout}
      onBackToMarket={onBackToMarket}
    />
  );
}

function AttemptPendingCard({
  onBackToCheckout,
  onBackToMarket
}: {
  onBackToCheckout: () => void;
  onBackToMarket: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section
      className="grid min-w-0 gap-4 rounded-lg border border-border bg-surface px-5 py-6 shadow-card"
      aria-labelledby="attempt-pending-heading"
      aria-busy="true"
    >
      <p className="text-[0.75rem] font-bold uppercase tracking-[0.14em] text-muted">
        Payment attempt
      </p>
      <h1
        id="attempt-pending-heading"
        ref={headingRef}
        tabIndex={-1}
        className="text-[clamp(1.5rem,3vw,2.125rem)] leading-[1.15] tracking-[-0.025em] text-ink"
      >
        Payment in progress
      </h1>
      <StatusMessage tone="pending">Simulating payment...</StatusMessage>
      <p className="max-w-prose text-muted">{paymentInProgressNote}</p>
      <div className="flex flex-wrap gap-3">
        <Button variant="quiet" onClick={onBackToCheckout}>
          Back to Checkout
        </Button>
        <Button variant="quiet" onClick={onBackToMarket}>
          Back to Market
        </Button>
      </div>
    </section>
  );
}

function RecoveryCard({
  recoveryStatus,
  paymentUncertain,
  onCheckPayment,
  onRetryRecovery,
  onAbandon,
  onBackToCheckout,
  onBackToMarket
}: {
  recoveryStatus: RecoveryStatus;
  paymentUncertain: boolean;
  onCheckPayment: () => void;
  onRetryRecovery: () => void;
  onAbandon: () => void;
  onBackToCheckout: () => void;
  onBackToMarket: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [isConfirmingAbandon, setIsConfirmingAbandon] = useState(false);
  const isChecking = recoveryStatus === "checking";
  const primaryMessage =
    recoveryStatus === "unavailable"
      ? unavailableReferenceMessage
      : recoveryStatus === "error"
        ? lookupFailedMessage
        : paymentUncertain
          ? unconfirmedPaymentPrimary
          : checkingJourneyMessage;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section
      className="grid min-w-0 gap-4 rounded-lg border border-border bg-surface px-5 py-6 shadow-card"
      aria-labelledby="attempt-recovery-heading"
      aria-busy={isChecking}
    >
      <p className="text-[0.75rem] font-bold uppercase tracking-[0.14em] text-muted">
        Payment attempt
      </p>
      <h1
        id="attempt-recovery-heading"
        ref={headingRef}
        tabIndex={-1}
        className="text-[clamp(1.5rem,3vw,2.125rem)] leading-[1.15] tracking-[-0.025em] text-ink"
      >
        {primaryMessage}
      </h1>
      {isChecking ? (
        <StatusMessage tone="pending">Checking this journey...</StatusMessage>
      ) : (
        <p className="max-w-prose text-muted">{unavailableReferenceNote}</p>
      )}
      <div className="flex flex-wrap gap-3">
        {!isChecking && paymentUncertain && recoveryStatus === "idle" ? (
          <Button onClick={onCheckPayment}>Check this attempt</Button>
        ) : null}
        {!isChecking && (recoveryStatus === "unavailable" || recoveryStatus === "error") ? (
          <Button onClick={onRetryRecovery}>Try again</Button>
        ) : null}
        <Button variant="quiet" onClick={onBackToCheckout}>
          Back to Checkout
        </Button>
        <Button variant="quiet" onClick={onBackToMarket}>
          Back to Market
        </Button>
      </div>
      {isChecking ? null : (
        <AbandonControl
          pending={false}
          isConfirming={isConfirmingAbandon}
          onRequestConfirm={() => setIsConfirmingAbandon(true)}
          onCancelConfirm={() => setIsConfirmingAbandon(false)}
          onAbandon={onAbandon}
        />
      )}
    </section>
  );
}

function AbandonControl({
  pending,
  isConfirming,
  onRequestConfirm,
  onCancelConfirm,
  onAbandon
}: {
  pending: boolean;
  isConfirming?: boolean;
  onRequestConfirm?: () => void;
  onCancelConfirm?: () => void;
  onAbandon: () => void;
}) {
  const [innerConfirming, setInnerConfirming] = useState(false);
  const confirming = isConfirming ?? innerConfirming;

  function requestConfirm() {
    if (onRequestConfirm) {
      onRequestConfirm();
      return;
    }

    setInnerConfirming(true);
  }

  function cancelConfirm() {
    if (onCancelConfirm) {
      onCancelConfirm();
      return;
    }

    setInnerConfirming(false);
  }

  if (!confirming) {
    return (
      <Button variant="quiet" onClick={requestConfirm} disabled={pending}>
        Stop following this reference
      </Button>
    );
  }

  return (
    <div className="grid gap-3 rounded-lg border border-border px-4 py-4">
      <p className="max-w-prose text-sm text-muted">{abandonWarning}</p>
      <div className="flex flex-wrap gap-3">
        <Button variant="quiet" onClick={onAbandon} disabled={pending}>
          {abandonConfirmLabel}
        </Button>
        <Button variant="quiet" onClick={cancelConfirm} disabled={pending}>
          {keepReferenceLabel}
        </Button>
      </div>
    </div>
  );
}
