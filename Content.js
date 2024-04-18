chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "refreshPage") {
    // Refresh the page when the message is received
    window.location.reload();
  }
});

console.log("chrome extension go..!");

let isProcessing = false;

const teckInput = document.getElementById("documentNo");
const numInput = document.getElementById("vehicleNo2");

const form = document.getElementById("form");
const isLoginPage = window.location.href.includes(
  "https://videos.police.ge/protocols.php?lang=ge"
);
const warning = document.getElementsByClassName("warning");

let data = [];

if (!isLoginPage) {
  fetchAndProcessData();
}
if (isLoginPage) {
  processRows();
}

async function fetchAndProcessData() {
  if (isProcessing) {
    return;
  }

  isProcessing = true;

  const apiUrl =
    "https://fine.mygps.ge:4437/api/UserCar/GetAllUserCars?Gotonext=" +
    getQueryParam();

  console.log("Before API call: ", getQueryParam());
  console.log("Before API call: apiUrl =", apiUrl);
  try {
    const response = await fetch(apiUrl);

    console.log(response.status);
    if (response.status === 417) {
      await sendPostRequestToEndpoint();
    }
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const car = await response.json();

      if (car) {
        console.log(car);

        await submitForm(car);
      } else {
        console.log("All cars processed!!");
      }
    } else {
      throw new Error("Invalid response format");
    }
  } catch (error) {
    console.error("Error fetching and processing data:", error);
  } finally {
    isProcessing = false;
  }
}
async function AddError(body) {
  const apiUrl = "https://fine.mygps.ge:4437/api/UserCar/AddError";
  console.log(body);
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // if (!response.ok) {
    //   throw new Error(`HTTP error! status: ${response.status}`);
    // }

    console.log(response);
  } catch (error) {
    console.error("Error during fetching:", error);
  }
}
async function submitForm(car) {
  teckInput.value = car.techPassportId;
  numInput.value = car.carNumber;

  //   console.log("Warning element:", warning);
  var warnings = document.getElementsByClassName("warning");
  if (warnings.length > 0) {
    var firstWarningText = warnings[0].textContent;
    if (
      firstWarningText == "ადმინისტრაციული სამართალდარღვევები ვერ მოიძებნა."
    ) {
      const returnValue = {
        carNumber: car.carNumber,
        techId: car.techPassportId,
        error: firstWarningText,
      };
      console.log(returnValue);
      AddError(returnValue);
    }
  }

  setTimeout(() => {
    console.log("Submitting form...");
    form.submit();
    console.log("Form submitted!");

    if (warning) {
      console.log(warning.value);
    }
  }, 3000);

  fetchAndProcessData();
}
function getQueryParam() {
  const warning = document.querySelector(".warning");

  if (warning !== null) {
    const message = warning.textContent;
    if (message.includes("ადმინისტრაციული სამართალდარღვევები ვერ მოიძებნა.")) {
      return "true";
    } else {
      return "false";
    }
  } else {
    return "true";
  }
}

async function processRows() {
  const rows = document.querySelectorAll(".row");
  let paid;
  rows.forEach((row) => {
    const fineNum = row.querySelector(".col:nth-child(2)");
    const fineDate = row.querySelector(".col:nth-child(3)");
    const fineArticle = row.querySelector(".col:nth-child(4)");
    const fineAmount = row.querySelector(".col:nth-child(5)");
    const fineStatus = row.querySelector(".col:nth-child(7)");

    if (fineNum && fineDate && fineArticle && fineAmount && fineStatus) {
      const fineNumText = fineNum.textContent.trim();
      const fineDateText = fineDate.textContent.trim().slice(0, 10);
      const fineArticleText = fineArticle.textContent.trim();
      const finAmountText = parseInt(
        fineAmount.textContent.trim().slice(0, -4)
      );
      const fineStatusText = fineStatus.textContent.trim();

      if (fineStatusText.includes("გადაუხდელია")) {
        paid = false;
      } else {
        paid = true;
      }
      console.log(paid);
      const receivedData = {
        receiptNumber: fineNumText,
        date: fineDateText,
        article: fineArticleText,
        amount: finAmountText,
        paid: paid,
      };

      data.push(receivedData);
      console.log(receivedData);
    }
  });

  const url = "https://fine.mygps.ge:4437/api/ReceivedSms/UpdateFineStatus";

  const formattedData = data.map((item) => ({
    receiptNumber: item.receiptNumber,
    date: item.date,
    article: item.article,
    amount: item.amount,
    paid: item.paid,
  }));
  console.log(formattedData);

  const formattedData1 = JSON.stringify(formattedData);
  console.log(formattedData1);

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: formattedData1,
  });
  console.log("Response status:", response.status);
  if (response.ok) {
    console.log("Data sent to backend successfully");
  } else {
    console.error("Failed to send data to backend");
  }
  console.log(response);
}
async function sendPostRequestToEndpoint() {
  console.log("sendPostRequestToEndpoint function is called");
  const anotherEndpointUrl = "https://fine.mygps.ge:4437/api/Email/SendEmail";

  try {
    const response = await fetch(anotherEndpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
    console.log("Response status:", response.status);
    if (response.ok) {
      console.log("POST request to  endpoint was successful");
    } else {
      console.error("Failed to send POST request to endpoint");
    }
  } catch (error) {
    console.error("Error sending POST request to endpoint:", error);
  }
}

async function navigateBack() {
  const backButtonSelector = 'input[type="submit"][value="უკან დაბრუნება"]';

  const backButton = document.querySelector(backButtonSelector);
  if (backButton) {
    backButton.click();
    await new Promise((resolve) => setTimeout(resolve, 2000));
    teckInput.value = "";
    numInput.value = "";
  }
}

setTimeout(() => {
  navigateBack();
}, 5000);
