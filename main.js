//const endpoint = "https://wax.greymass.com"; // Main-net
const endpoint = "https://waxtestnet.greymass.com"; // Test-net
//const chainid = '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a'; //Main-net
const chainid = 'f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12'; //Test net
const wax = new waxjs.WaxJS({
  rpcEndpoint: "https://wax.greymass.com",
  tryAutoLogin: false
});
const transport = new AnchorLinkBrowserTransport();
const anchorLink = new AnchorLink({
  transport,
  chains: [{
    chainId: chainid,
    nodeUrl: "https://wax.greymass.com",
  }],
});

const dapp = "WaxCPULoan";
const tokenContract = { WAX: "eosio.token" };
const menuPrices = [1, 2, 4];
const default_wax_value = 100;
const pools = [
  {
    name: "Pool 1",
    url: "https://cpuloanpools.github.io/cpuloanpools/",
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
var username="";
var day_count = 1;
main();

async function main() {
  loggedIn = false;
  configPromise = GetConfig();
  config = await configPromise;
  console.log(config);
  if (config.Valid) {
    PopulateMenu();
    freeSpace = await GetFreeSpace();
    await populateDropdown();
    autoLogin();
    document.getElementById("userinput").oninput = UserInputChanged;

  } /**/
}

async function populateDropdown(){
  var drop_down_parent = document.getElementById("drop_content");
  var child = drop_down_parent.lastElementChild; 
  while (child) {
    drop_down_parent.removeChild(child);
    child = drop_down_parent.lastElementChild;
  }
  let i = 1;
  for(const cdata of config.Multiplier){
    var day_val = cdata.days;
    day_val = day_val == "1" ? "24 Hours" : day_val + " days";
    var dropdown = document.createElement('input');
    dropdown.type = "button";
    dropdown.className = "api-buttons";
    dropdown.value = day_val;
    dropdown.id = i+"dropdown";
    dropdown.setAttribute("onclick",'TimeInputChanged("'+day_val+'");');
    dropdown.style = "margin-top: 10px;";
    drop_down_parent.appendChild(dropdown);
    i++;
  }
  document.getElementById(config.Multiplier.length+"dropdown").style.marginBottom = "10px";
}

async function PopulateMenu() {
  var menu = "";
  var symbol = "WAX";
  console.log(menuPrices);
  for (var index = 0; index <= menuPrices.length; ++index) {
    var timeMultiplier = await GetTimeMultiplier();
    console.log(timeMultiplier);
    console.log(config);

    var standard = index < menuPrices.length;
    let fee_rate;
    for(const mdata of config.Multiplier){
      if(parseInt(mdata.days) == timeMultiplier){
        fee_rate = (parseFloat(mdata.fees).toFixed(8) / 100);
      }
    }
    console.log(fee_rate);
    var buyAmount = standard
      ? menuPrices[index] * default_wax_value * fee_rate : '<span id="customamount"></span>';
    console.log(buyAmount);
    var stakeAmount = standard
    ? menuPrices[index] * default_wax_value
    : '<input type="number" id="custominput" name="custominput" pattern="d*">';
    var disabled = standard ? "" : " disabled";
    var days = (timeMultiplier * config.StakeSeconds) / 3600 / 24;
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
      (standard ? buyAmount : -1) +
      ")" +
      disabled +
      ">" +
      "BUY NOW " +
      (standard ? parseFloat(buyAmount).toFixed(2) : buyAmount) +
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
  //document.getElementById("pool_d").innerHTML = html;
}

async function CustomInputChanged() {
  var element = document.getElementById("custominput");
  element.value = parseInt(element.value);
  console.log(element.value);
  var valid = element.value > 0;
  var timeMultiplier = await GetTimeMultiplier();
  for(const mdata of config.Multiplier){
    console.log(mdata);
    if(timeMultiplier == parseInt(mdata.days)){
      document.getElementById("customamount").textContent = parseFloat((parseFloat(mdata.fees).toFixed(8)/100) * element.value).toFixed(2);
      document.getElementById("buy" + menuPrices.length).disabled = !valid;   
      break;
    }
  }
}

async function show_drpdown(){
  if(document.getElementById("drop_content").style.display == "block")
    document.getElementById("drop_content").style.display = "none";
  else
    document.getElementById("drop_content").style.display = "block";
}

async function TimeInputChanged(day_val) {
  document.getElementById("drop_content").style.display = "none";
  day_count = day_val.split(' ')[0];
  document.getElementById("timeinput").value = day_val;
  PopulateMenu();
  CustomInputChanged();
}

function UserInputChanged() {
  var textValue = document.getElementById("userinput").value;
  console.log(textValue);

  username=textValue;
}

async function GetTimeMultiplier() {
  var textValue = document.getElementById("timeinput").value;
  if (textValue.length > 0) {
    var timeMultiplier = textValue == "24 Hours" || textValue == "24 HOURS" ? 1 : parseInt(textValue);
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
const buy = async(amount) =>{
  if (loggedIn) {
    try {
      HideMessage();
      var amount_total =
        amount < 0
          ? parseFloat(document.getElementById("customamount").innerHTML)
          : amount;
      decimal_points = CalcDecimals(config.MinimumTransfer);
      amount_to_transfer = parseFloat(amount_total).toFixed(decimal_points);
      console.log(amount_to_transfer);
      var timeMultiplier = GetTimeMultiplier();
      if(username!="") timeMultiplier+="%"+username;
      else timeMultiplier+="%"+wallet_userAccount;
      let symbol = "WAX";
      const result = await wallet_transact([
        {
          account: "eosio.token",
          name: "transfer",
          authorization: [{
            actor: wallet_userAccount,
            permission: wallet_auth
          }],
          data: {
            from: wallet_userAccount,
            to: contract,
            quantity: amount_to_transfer.toString() + " " + symbol,
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
    var path = "/v1/chain/get_table_rows";
    var data = JSON.stringify({
      json: true,
      code: "eosio.token",
      scope: contract,
      table: "accounts",
      lower_bound: "WAX",
      upper_bound: "WAX",
      limit: 1,
    });
    const response = await fetch(endpoint + path, {
      headers: { "Content-Type": "text/plain" },
      body: data,
      method: "POST",
    });
    const body = await response.json();
    console.log(body);
    if (body.rows && Array.isArray(body.rows) && body.rows.length == 1) {
        document.getElementById("freeval").innerHTML =
        Math.floor(parseFloat(body.rows[0].balance)) +
          " wax";
        document.getElementById("lowtxt").style.display = parseInt(body.rows[0].balance) > 100 ? "none" : "block";
        document.getElementById("distxt").style.display = parseInt(body.rows[0].balance) > 100 ? "block" : "none";
    } else {
      ShowToast("Unexpected response retrieving balance");
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
  document.getElementById("freeval").innerHTML = "0 wax";
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
    ShowToast(e.message);
  }
}

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

  const response = await fetch(endpoint + path, {
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
      Multiplier: body.rows[0].cpu_multiplier,
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
    wallet_auth = String(wallet_session.auth).split("@")[1];
    anchorAuth = wallet_auth;

  } else {
    wallet_userAccount = await wax.login();
    wallet_session = wax.api;
    wallet_auth = "active";
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
    var result = await wallet_session.transact({
      actions: actions
    }, {
      blocksBehind: 3,
      expireSeconds: 30
    });
    result = {
      transaction_id: result.processed.id
    };
  } else {
    var result = await wallet_session.transact({
      actions: actions
    }, {
      blocksBehind: 3,
      expireSeconds: 30
    });
  }
  return result;
}
