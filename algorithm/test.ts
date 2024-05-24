import { findXForArea } from "./utilities";

console.log(findXForArea(
    new Array(1000).fill(null).map((_, x) => [x, 100]),
    707,
    8972,
  ));