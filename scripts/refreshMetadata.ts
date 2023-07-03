import NftContractProvider from "../lib/NftContractProvider";
import CollectionConfig from "../config/CollectionConfig";
import fetch from "node-fetch";

const base_url = "https://api.opensea.io/api/v1/asset/"; // For testnets use "https://testnets-api.opensea.io/api/v1/asset/"
const smart_contract_address = "0x0be5204f83fb8dd139d00dffb011f08f7310a1e3";
const token_number = 10000;
const not_updated_list: number[] = []; // If only few tokens are not updated, insert their token_num in here
const time_limit = 60 * 60; // One hour by default

const session = fetch.defaults({ method: "GET" });
let num_updated = 0;
let num_cycles = 0;
let not_updated = not_updated_list.length
  ? not_updated_list
  : Array.from({ length: token_number }, (_, i) => i + 1);

async function main() {
  const start_time = Date.now();
  console.log("List:", not_updated);
  while (Date.now() - start_time < time_limit) {
    const temp_lis: number[] = [];
    num_updated = 0;
    for (const i of not_updated) {
      const url = `${base_url}${smart_contract_address}/${i}/?force_update=true&format=json`;
      const response = await session(url);
      const r = await response.json();
      if ("image_original_url" in r && r["image_original_url"] !== null) {
        num_updated++;
        console.log(`${i} Token updated`);
      } else if ("success" in r) {
        break;
      } else {
        temp_lis.push(i);
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    num_cycles++;
    console.log(
      `\n############# Completed cycle n°${num_cycles} ##  Updated = ${num_updated}/${not_updated.length}`
    );
    console.log(`              Remaining: ${temp_lis}`);
    if (!temp_lis.length) {
      break;
    }
    not_updated = temp_lis;
    await new Promise((resolve) => setTimeout(resolve, 20000));
  }

  console.log("\n\n############# All tokens Updated");
  console.log(`              Done in ${Date.now() - start_time} milliseconds.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
