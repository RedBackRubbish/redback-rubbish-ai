document.querySelector(".mascot-chat-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.querySelector("#mascot-input");
  const message = input.value.trim();
  if (!message) return;

  addMessage(message, "user"); // display message

  const res = await fetch("/functions/tai-ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  const data = await res.json();
  addMessage(data.reply, "tai"); // add AI reply

  input.value = "";
});
