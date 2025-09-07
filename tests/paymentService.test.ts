import assert from "node:assert";
import axios from "axios";

import * as paymentService from "../services/paymentService";
import Payment from "../database/models/paymentModel";

// Simple monkeypatching for unit test
const originalAxiosPost = (axios as any).post;
const originalPaymentCreate = (Payment as any).create;
const originalPaymentUpdate = (Payment as any).update;

async function run() {
  try {
    let axiosCalled = false;
    (axios as any).post = async (..._args: any[]) => {
      axiosCalled = true;
      return { data: { status: "COMPLETE", ref_id: "ABC123" } } as any;
    };

    let created: any = null;
    (Payment as any).create = async (obj: any) => {
      created = obj;
      return obj as any;
    };

    let updated: any = null;
    (Payment as any).update = async (obj: any) => {
      updated = obj;
      return [1, []];
    };

    const resp = await (paymentService as any).validateEsewaPayment({ transaction_uuid: "tx1", total_amount: 100 });
    assert(axiosCalled, "axios should be called");
    assert(created, "Payment.create should be called");
    assert(resp && resp.status === "COMPLETE", "response should be forwarded");

    console.log("paymentService.validateEsewaPayment test passed");
  } finally {
    (axios as any).post = originalAxiosPost;
    (Payment as any).create = originalPaymentCreate;
    (Payment as any).update = originalPaymentUpdate;
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
