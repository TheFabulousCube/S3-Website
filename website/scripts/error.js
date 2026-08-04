document.addEventListener("DOMContentLoaded", function () {
  var tryBtn = document.getElementById("tryAgain");
  var debug = document.getElementById("debug");

  if (!tryBtn || !debug) {
    return;
  }

  tryBtn.addEventListener("click", async function () {
    tryBtn.disabled = true;
    tryBtn.textContent = "Checking...";
    var url = window.location.href;

    try {
      var res = await fetch(url, { method: "GET", cache: "no-store" });

      if (res.ok) {
        window.location.reload();
      } else {
        debug.style.display = "block";
        debug.textContent =
          "Server returned " +
          res.status +
          " " +
          res.statusText +
          " - showing error page.";
      }
    } catch (err) {
      debug.style.display = "block";
      debug.textContent = "Network error - unable to reach origin.";
    } finally {
      tryBtn.disabled = false;
      tryBtn.textContent = "Try Again";
    }
  });
});
