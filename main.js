const dapp = "WaxCPULoan";
const endpoint = "wax.eosphere.io";
const chainId =
  "1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4";
const tokenContract = { WAX: "eosio.token" };
const menuPrices = [1, 2, 4];
const pools = [
  {
    name: "Pool 1",
    url: "https://cpuloanpools.github.io",
    contract: "cpuloanpools",
  },
  {
    name: "Pool 2",
    url: "https://cpuloanpools.github.io/cpuloanpools/SecondPool/",
    contract: "cpuloanpool2",
  },
  {
    name: "Pool 3",
    url: "https://cpuloanpools.github.io/cpuloanpools/ThirdPool/",
    contract: "cpuloanpool3",
  },
  {
    name: "Pool 4",
    url: "https://cpuloanpools.github.io/cpuloanpools/FourthPool/",
    contract: "cpuloanpool4",
  },

  //{ name: "x2 pool", url: "/x2pool/", contract: "x2waxcpuloan" },
];
var wallet_auth="owner";

main();

async function main() {
  loggedIn = false;
  configPromise = GetConfig();
  config = await configPromise;
  console.log(config);
  if (config.Valid) {
    PopulateMenu();
    freeSpace = await GetFreeSpace();

    PopulatePoolList();
    autoLogin();
    document.getElementById("timeinput").oninput = TimeInputChanged;
  } /**/
}

function PopulateMenu() {
  var menu = "";
  var symbol = "WAX";
  for (var index = 0; index <= menuPrices.length; ++index) {
    var timeMultiplier = GetTimeMultiplier();
    console.log(timeMultiplier);
    console.log(config.StakeSeconds);

    var standard = index < menuPrices.length;
    var buyAmount = standard
      ? menuPrices[index] * timeMultiplier
      : '<span id="customamount"></span>';
    var stakeAmount = standard
      ? menuPrices[index] * config.Multiplier
      : '<input type="number" id="custominput" name="custominput" pattern="d*">';
    var disabled = standard ? "" : " disabled";
    var days = (timeMultiplier * config.StakeSeconds) / 3600 / 24;
    console.log(buyAmount);
    var string = "item" + index;
    menu += '<div  class="menuentry"><table><tr>';
    menu += '<td class="stakeamount">' + stakeAmount + " WAX</td>";
    menu +=
      '<tr><td class="timeperiod">staked for ' +
      days +
      " day" +
      (days > 1 ? "s" : "") +
      "</tr></td></a>";
    menu +=
      '<tr><td><button id="buy' +
      index +
      '" class="buy" onclick=' +
      "buy(" +
      (standard ? menuPrices[index] * timeMultiplier : -1) +
      ")" +
      disabled +
      ">" +
      "BUY NOW " +
      buyAmount +
      " " +
      symbol +
      "</button></td>";
    menu += "</tr></table></div>";
  }
  document.getElementById("menu").innerHTML = menu;
  document.getElementById("custominput").oninput = CustomInputChanged;
}

function PopulatePoolList() {
  var html = '<div  id="poolinfo">';
  for (var index = 0; index < pools.length; ++index) {
    html +=
      '<div  class="pools_td"><a href="' +
      pools[index].url +
      ' "style="text-decoration:underline;" >' +
      
      pools[index].name +
      "</a><br>" +'<div class="pools_a">'+
      pools[index].freeSpace +
      " WAX</div></div>";
  }
  html += "</div>";
  document.getElementById("pool_d").innerHTML = html;
}

function CustomInputChanged() {
  var element = document.getElementById("custominput");
  element.value = parseInt(element.value);
  var valid = element.value > 0;
  var timeMultiplier = GetTimeMultiplier();
  document.getElementById("customamount").innerHTML =
    (timeMultiplier * element.value) / config.Multiplier;
  document.getElementById("buy" + menuPrices.length).disabled = !valid;
}
function TimeInputChanged() {
  var textValue = document.getElementById("timeinput").value;
  if (textValue.length > 0) {
    var value = parseInt(textValue);
    if (value < 1) {
      value = 1;
    }
    document.getElementById("timeinput").value = value;
    document.getElementById("timeunit").innerHTML = value > 1 ? "days" : "day";
  }
  var oldCustom = document.getElementById("custominput").value;
  PopulateMenu();
  document.getElementById("custominput").value = oldCustom;
  CustomInputChanged();
}
function GetTimeMultiplier() {
  var textValue = document.getElementById("timeinput").value;
  if (textValue.length > 0) {
    var timeMultiplier = parseInt(textValue);
    if (timeMultiplier < 1) {
      timeMultiplier = 1;
    }
    return timeMultiplier;
  } else {
    return 1;
  }
}
function WalletListVisible(visible) {
  document.getElementById("walletlist").style.visibility = visible
    ? "visible"
    : "hidden";
}
function ShowMessage(message) {
  document.getElementById("messagecontent").innerHTML = message;
  document.getElementById("message").style.visibility = "visible";
}
function HideMessage(message) {
  document.getElementById("message").style.visibility = "hidden";
}
async function buy(amount) {
  if (loggedIn) {
    HideMessage();
    var amount =
      amount < 0
        ? parseFloat(document.getElementById("customamount").innerHTML)
        : amount;
    amount = amount.toFixed(CalcDecimals(config.MinimumTransfer)) + " " + "WAX";
    var timeMultiplier = GetTimeMultiplier();
    try {
      const result = await wallet_transact([
        {
          account: "eosio.token",
          name: "transfer",
          authorization: [{ actor: wallet_userAccount, permission: wallet_auth }],
          data: {
            from: wallet_userAccount,
            to: contract,
            quantity: amount,
            memo: timeMultiplier,
          },
        },
      ]);
      ShowMessage(
        '<div class="complete">Success</div><div class="link"><a href="https://wax.bloks.io/transaction/' +
          result.transaction_id +
          '?tab=traces">View transaction</a></div>'
      );
    } catch (e) {
      ShowToast(e.message);
    }
  } else {
    WalletListVisible(true);
  }
}

function CalcDecimals(quantity) {
  var dotPos = quantity.indexOf(".");
  var spacePos = quantity.indexOf(" ");
  if (dotPos != -1 && spacePos != -1) {
    return spacePos - dotPos - 1;
  }
  return 0;
}

async function GetFreeSpace() {
  for (var index = 0; index < pools.length; index++) {
    var path = "/v1/chain/get_table_rows";
    var data = JSON.stringify({
      json: true,
      code: "eosio.token",
      scope: pools[index].contract,
      table: "accounts",
      lower_bound: "WAX",
      upper_bound: "WAX",
      limit: 1,
    });
    const response = await fetch("https://" + endpoint + path, {
      headers: { "Content-Type": "text/plain" },
      body: data,
      method: "POST",
    });
    const body = await response.json();
    if (body.rows && Array.isArray(body.rows) && body.rows.length == 1) {
      pools[index].freeSpace = Math.floor(parseFloat(body.rows[0].balance));
      if (pools[index].contract == contract) {
        document.getElementById("freevalue").innerHTML =
          pools[index].name +
          ": " +
          pools[index].freeSpace +
          " WAX" +
          " available";
      }
    } else {
      ShowToast("Unexpected response retrieving balance");
    }
  }
}
async function ShowToast(message) {
  var element = document.getElementById("toast");
  element.innerHTML = message;
  toastU = 0;
  var slideFrac = 0.05;
  var width = element.offsetWidth;
  var right = 16;
  var id = setInterval(frame, 1e3 / 60);
  element.style.right = -width + "px";
  element.style.visibility = "visible";
  function frame() {
    toastU += 0.005;
    if (toastU > 1) {
      clearInterval(id);
      element.style.visibility = "hidden";
    }
    p =
      toastU < slideFrac
        ? toastU / slideFrac / 2
        : 1 - toastU < slideFrac
        ? (1 - toastU) / slideFrac / 2
        : 0.5;
    element.style.right =
      (width + right) * Math.sin(p * Math.PI) - width + "px";
  }
}
async function autoLogin() {
  var isAutoLoginAvailable = await wallet_isAutoLoginAvailable();
  if (isAutoLoginAvailable) {
    login();
  }
}
async function selectWallet(walletType) {
  wallet_selectWallet(walletType);
  login();
}
async function logout() {
  wallet_logout();
  document.getElementById("loggedin").style.display = "none";
  document.getElementById("loggedout").style.display = "block";
  loggedIn = false;
  HideMessage();
}
async function login() {
  try {
    const userAccount = await wallet_login();
    ShowToast("Logged in as: " + userAccount);
    document.getElementById("accountname").innerHTML = userAccount;
    document.getElementById("loggedout").style.display = "none";
    document.getElementById("loggedin").style.display = "block";
    WalletListVisible(false);
    loggedIn = true;
  } catch (e) {
    document.getElementById("response").innerHTML = e.message;
  }
}
const wax = new waxjs.WaxJS("https://" + endpoint, null, null, false);
const anchorTransport = new AnchorLinkBrowserTransport();
const anchorLink = new AnchorLink({
  transport: anchorTransport,
  verifyProofs: true,
  chains: [{ chainId: chainId, nodeUrl: "https://" + endpoint }],
});
async function wallet_isAutoLoginAvailable() {
  var sessionList = await anchorLink.listSessions(dapp);
  if (sessionList && sessionList.length > 0) {
    useAnchor = true;
    return true;
  } else {
    useAnchor = false;
    return await wax.isAutoLoginAvailable();
  }
}

async function GetConfig() {
  var path = "/v1/chain/get_table_rows";

  var data = JSON.stringify({
    json: true,
    code: contract,
    scope: contract,
    table: "config",
    limit: 1,
  });

  const response = await fetch("https://" + endpoint + path, {
    headers: { "Content-Type": "text/plain" },
    body: data,
    method: "POST",
  });

  const body = await response.json();
  console.log(body);
  if (body.rows && Array.isArray(body.rows) && body.rows.length == 1) {
    return {
      Valid: true,
      StakeSeconds: parseInt(body.rows[0].unstakeSeconds),
      MinimumTransfer: body.rows[0].min_amount,
      Multiplier: parseInt(body.rows[0].cpu_multiplier),
    };
  } else {
    ShowToast("Unexpected response retrieving config");
    return { Valid: false };
  } /* */
}

async function wallet_selectWallet(walletType) {
  useAnchor = walletType == "anchor";
}
async function wallet_login() {
  if (useAnchor) {
    var sessionList = await anchorLink.listSessions(dapp);
    if (sessionList && sessionList.length > 0) {
      wallet_session = await anchorLink.restoreSession(dapp);
    } else {
      wallet_session = (await anchorLink.login(dapp)).session;
    }
    wallet_userAccount = String(wallet_session.auth).split("@")[0];
    wallet_auth=String(wallet_session.auth).split("@")[1];
  } else {
    wallet_userAccount = await wax.login();
    wallet_session = wax.api;
    wallet_auth="active";
  }
  return wallet_userAccount;
}
async function wallet_logout() {
  if (useAnchor) {
    await anchorLink.clearSessions(dapp);
  }
}
async function wallet_transact(actions) {
  if (useAnchor) {
    var result = await wallet_session.transact(
      { actions: actions },
      { blocksBehind: 3, expireSeconds: 30 }
    );
    result = { transaction_id: result.processed.id };
  } else {
    var result = await wallet_session.transact(
      { actions: actions },
      { blocksBehind: 3, expireSeconds: 30 }
    );
  }
  return result;
}
