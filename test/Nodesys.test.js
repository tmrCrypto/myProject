const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const chai = require("chai");
  const { ethers } = require("hardhat");
  const { BigNumber } = require("ethers");
  const chaiAsPromised = require('chai-as-promised');
  chai.use(chaiAsPromised);
  const { expect } = chai;


describe("Nodesys", function () {
  const Contracts = {
    nodesys_acc0: "",
    nodesys_acc1: "",
    nodesys_acc2: "",
    vesting: "",
    helper: ""
  }

  var address = ""


  async function deployOneYearLockFixture() {

    const accounts = await ethers.getSigners();
    const addresses = accounts.map(signer => signer.address);

    const args = Array(addresses[0], addresses[1], addresses[2])

    const Nodesys = await ethers.getContractFactory("Nodesys");
    const nodesys = await Nodesys.deploy(args)

    const Helper = await ethers.getContractFactory("Helper");
    const helper = await Helper.deploy()

    Contracts.nodesys_acc0 =  nodesys.connect(accounts[0]);
    Contracts.nodesys_acc1 =  nodesys.connect(accounts[1]);
    Contracts.nodesys_acc2 =  nodesys.connect(accounts[2]);
    Contracts.nodesys_acc3 =  nodesys.connect(accounts[3]);
    Contracts.nodesys_acc6 =  nodesys.connect(accounts[6]);
    Contracts.nodesys_acc7 =  nodesys.connect(accounts[7]);

    Contracts.helper = helper
    address = addresses

  }

  it('should return address Nodesys', async function () {
    await deployOneYearLockFixture();
    console.log("Address Nodesys = ",Contracts.nodesys_acc0.address)
    console.log("Address Helper = ",Contracts.helper.address)
    
 });
  
  it('addAddressToVesting through consensus', async function () {
      const addresses = Array(address[3],address[4],address[5])
      const amounts = Array(BigNumber.from(BigInt(500 * 10 **18)),BigNumber.from(BigInt(500 * 10 **18)),BigNumber.from(BigInt(700 * 10 **18)))
      let data = await Contracts.helper.AddrArray_UintArray_To_Bytes(addresses,amounts)
      let func_name = "addAddressToVesting(address[],uint256[])"
      
      
      const exec_propos = await Contracts.nodesys_acc0.addExecProposal(func_name,data)
      const reciept = await exec_propos.wait()
      
      const event = await reciept.events[0];
      const _txID = event.args.txId
      
      expect(event.args.sender).to.equal(address[0])
      expect(event.args.to).to.equal(Contracts.nodesys_acc0.address)
      expect(event.args.func).to.equal(func_name)
      expect(event.args.data).to.equal(data)
      
      const confirm1 = await Contracts.nodesys_acc1.confirm(_txID)
     
      const confirm2 = await Contracts.nodesys_acc2.confirm(_txID)
      const reciept2 = await confirm2.wait()
      const event2 = await reciept2.events;

      expect(event2[6].args.sender).to.equal(address[2])
      expect(event2[6].args.txId).to.equal(_txID)
      expect(event2[6].args.func).to.equal(func_name)

      expect(event2[1].args.user).to.equal(address[3])
      expect(event2[3].args.user).to.equal(address[4])
      expect(event2[5].args.user).to.equal(address[5])

  });

  it("Add extension vesting", async function(){
    let addrVesting = await Contracts.nodesys_acc0.callStatic.vestingUsers(address[3],0)
    const Vesting =  await ethers.getContractFactory("Vesting");
    const vesting = await Vesting.attach(addrVesting);

    const addExt = await Contracts.nodesys_acc1.addException(addrVesting, address[3])
    await expect(Contracts.nodesys_acc1.addException("0x0000000000000000000000000000000000000000", address[3])).to.be.rejectedWith("Vesting cannot be a zero address")
    await expect(Contracts.nodesys_acc1.addException(addrVesting, "0x0000000000000000000000000000000000000000")).to.be.rejectedWith("User cannot be a zero address")
    await expect(Contracts.nodesys_acc1.addException(addrVesting, address[3])).to.be.rejectedWith("The user has not been added or is on the exclusion list")

    let ext = await vesting.callStatic.userData(address[3])
    console.log(ext)

    expect(ext["exclusion"]).to.equal(true)

    
  })
  
  
  it("add Owner",async function(){
      let data = await Contracts.helper.addr_To_Byte(address[8])
      let func_name = "addOwner(address)"
      
      
      const exec_propos = await Contracts.nodesys_acc0.addExecProposal(func_name,data)
      const reciept = await exec_propos.wait()
      
      const event = await reciept.events[0];
      const _txID = event.args.txId

      const confirm1 = await Contracts.nodesys_acc1.confirm(_txID)
      const confirm2 = await Contracts.nodesys_acc2.confirm(_txID)

      newOwner = await Contracts.nodesys_acc0.callStatic.owners(3)

      expect(newOwner).to.equal(address[8])

  })

  it("del Owner",async function(){
    let data = await Contracts.helper.uint_To_Bytes(3)
    let func_name = "delOwner(uint256)"
    
    
    const exec_propos = await Contracts.nodesys_acc0.addExecProposal(func_name,data)
    const reciept = await exec_propos.wait()
    
    const event = await reciept.events[0];
    const _txID = event.args.txId

    const confirm1 = await Contracts.nodesys_acc1.confirm(_txID)
    const confirm2 = await Contracts.nodesys_acc2.confirm(_txID)

    newOwner = await Contracts.nodesys_acc0.callStatic.seeOwners()

    expect(newOwner.length).to.equal(3)

  })

  it("cancel Confirmation and discard tx",async function(){
    let data = await Contracts.helper.addr_To_Byte(address[8])
    let func_name = "addOwner(address)"
    
    const exec_propos = await Contracts.nodesys_acc0.addExecProposal(func_name,data)
    const reciept = await exec_propos.wait()
    
    const event = await reciept.events[0];
    const _txID = event.args.txId

    await expect(Contracts.nodesys_acc3.confirm(_txID)).to.be.rejectedWith("You are not the owner")
    await expect(Contracts.nodesys_acc0.confirm(_txID)).to.be.rejectedWith("already confirmed!")

    const confirm1 = await Contracts.nodesys_acc1.confirm(_txID)

    const cancel0 = await Contracts.nodesys_acc0.cancelConfirmation(_txID)
    const cancel1 = await Contracts.nodesys_acc1.cancelConfirmation(_txID)

    await expect(Contracts.nodesys_acc0.confirm(_txID)).to.be.rejectedWith("not queued!")

    const reciept_cancel = await cancel1.wait()
    const event_discard = await reciept_cancel.events[0];

    expect(event_discard.args.txId).to.equal(_txID)
    
  })

  it("assign minimum require conf ",async function(){

    let data = await Contracts.helper.uint_To_Bytes(2)
    let func_name = "assignRequiredConf(uint8)"
    
    const exec_propos = await Contracts.nodesys_acc0.addExecProposal(func_name,data)
    const reciept = await exec_propos.wait()
    
    const event = await reciept.events[0];
    const _txID = event.args.txId

    const confirm1 = await Contracts.nodesys_acc1.confirm(_txID)
    const confirm2 = await Contracts.nodesys_acc2.confirm(_txID)

    const recieptReq = await confirm2.wait()
    const eventReq = await recieptReq.events[0];

    reqConf = await Contracts.nodesys_acc0.callStatic.seeMinCofReq()
  
    expect(reqConf).to.equal(eventReq.args.minConfirm)

  })

  it("mint token",async function(){

    let data = await Contracts.helper.addr_Uint_To_Bytes(address[3],BigNumber.from(BigInt(700 * 10 ** 18)))
    let func_name = "mint(address,uint256)"
    //expect require onlyConsensus
    await expect(Contracts.nodesys_acc3.mint(address[3], BigNumber.from(BigInt(700 * 10 ** 18)))).to.be.rejectedWith("Call the consensus function")
    
    const exec_propos = await Contracts.nodesys_acc0.addExecProposal(func_name,data)
    const reciept = await exec_propos.wait()
    
    const event = await reciept.events[0];
    const _txID = event.args.txId

    const confirm1 = await Contracts.nodesys_acc1.confirm(_txID)

    balances = await Contracts.nodesys_acc0.callStatic.balanceOf(address[3])
    balances = BigNumber.from(BigInt(balances))
    expect(balances).to.equal(BigNumber.from(BigInt(700 * 10 ** 18)))

  })

  it("transfer token  token",async function(){

    const propos = await Contracts.nodesys_acc3.transfer(address[6],BigNumber.from(BigInt(200 * 10**18)))
    const transfer_lock = await expect(Contracts.nodesys_acc6.transfer(address[7], BigNumber.from(BigInt(200 * 10**18)))).to.be.rejectedWith("Your address is not unblocked by Vesting")

    await Contracts.nodesys_acc0.transfer(address[6],BigNumber.from(BigInt(200 * 10**18)))
    await Contracts.nodesys_acc6.transfer(address[7], BigNumber.from(BigInt(200 * 10**18)))

    balances = await Contracts.nodesys_acc0.callStatic.balanceOf(address[7])
    balances = BigNumber.from(BigInt(balances))

    expect(balances).to.equal(BigNumber.from(BigInt(200 * 10**18)))

    await expect(Contracts.nodesys_acc6.transfer(address[7], BigNumber.from(BigInt(200 * 10**18)))).to.be.rejectedWith("Your address is not unblocked by Vesting")



  })

  it("Unlock user random to vesting", async function(){
    let addrVesting = await Contracts.nodesys_acc0.callStatic.vestingUsers(address[3],0)
    const Vesting =  await ethers.getContractFactory("Vesting");
    const vesting = await Vesting.attach(addrVesting);

    const unlock = await Contracts.nodesys_acc0.unlockUsers(addrVesting,50)
    await expect(Contracts.nodesys_acc0.unlockUsers(address[5],50)).to.be.rejectedWith("Such a vesting address does not exist")

    const reciept = await unlock.wait()
    checkUnlock3 = await vesting.callStatic.userData(address[3])
    checkUnlock4 = await vesting.callStatic.userData(address[4])
    checkUnlock5 = await vesting.callStatic.userData(address[5])

    console.log(checkUnlock3["unlock"],checkUnlock4["unlock"],checkUnlock5["unlock"])
  })

  it("Unlock all user to vesting", async function(){
    let addrVesting = await Contracts.nodesys_acc0.callStatic.vestingUsers(address[4],0)
    const Vesting =  await ethers.getContractFactory("Vesting");
    const vesting = await Vesting.attach(addrVesting);

    const unlock = await Contracts.nodesys_acc0.unlockAllUsers(addrVesting)

    await expect(Contracts.nodesys_acc0.unlockAllUsers(address[5])).to.be.rejectedWith("Such a vesting address does not exist")

    const reciept = await unlock.wait()

    await expect(Contracts.nodesys_acc1.addException(addrVesting, address[3])).to.be.rejectedWith("User unlocked")

    checkUnlock3 = await vesting.callStatic.checkUnlock(address[3])
    checkUnlock4 = await vesting.callStatic.checkUnlock(address[4])
    checkUnlock5 = await vesting.callStatic.checkUnlock(address[5])

    expect(checkUnlock3).to.equal(true)
    expect(checkUnlock4).to.equal(true)
    expect(checkUnlock5).to.equal(true)

  })


});
