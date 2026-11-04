import { connect } from "../platform";

export const { db } = connect(process.env.DATABASE_URL ?? "postgres://mm:mm@127.0.0.1:54329/mm");
