addEventListener("networkStatusChange", (resolve, reject, args) => {
  console.log("do something to update the system here");
  resolve();
});
