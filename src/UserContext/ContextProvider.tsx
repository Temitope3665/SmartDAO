/* eslint-disable react-hooks/exhaustive-deps */
import { ReactNode, useEffect, useMemo, useState } from "react";
import { UserContext } from ".";
import useLocalStorage from "../hooks/useLocalStorage";
import { login, smartdaoAddress } from "../utils/contract/smartdao.js";
import smartdaoACI from "../utils/contract/smartdao.json";
import daoACI from "../utils/contract/dao.json";
import { IAccount, IDAO, IProposal } from "../types";

interface IContextProvider {
  children: ReactNode;
}

const ContextProvider = ({ children }: IContextProvider) => {
  const [aeSdk, setAeSdk]: any = useState();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [account, setAccount] = useState<IAccount>({ address: "", balance: 0 });
  const [showModal, setShowModal] = useState(false);
  const { getLocalStorage, setLocalStorage, clearStorage } = useLocalStorage();

  const loginUser = async () => {
    const client = await login();
    console.log({ client })
    setAeSdk(client);
    console.log({ aeSdk })
    setIsLoggedIn(true);
    const address = Object.keys(client!._accounts!.current)[0];
    const balance = (await client!.getBalance(`ak_${address.slice(3)}`));
    setAccount({
      address,
      balance: parseFloat(balance) / 1e18
    });
    setLocalStorage({ key: 'isLoggedIn', value: true });
    setIsLoggedIn(true);
  };

  const logoutUser = async () => {
    clearStorage()
    await aeSdk.disconnectWallet();
    setIsLoggedIn(false);
  }

  const init = async () => {
    try {
      await loginUser();
    } catch (error) {
      console.log({ error })
    }
  }

  useEffect(() => {
    init();
  }, []);

  const createDAO = async (dao: IDAO) => {
    const contract = await aeSdk.initializeContract({ aci: smartdaoACI, address: smartdaoAddress });
    console.log({ contract })
    const res = await contract.createDAO(dao.name.toLowerCase(), dao.description, dao.tokenSymbol, dao.image, dao.socials, dao.initialMembers, dao.startingBalance, { amount: dao.startingBalance * 1e18 });
    console.log({ res });
  }

  async function getDAO(id: string) {
    const contract = await aeSdk.initializeContract({ aci: smartdaoACI, address: smartdaoAddress })
    const res = await contract.getDAO(id);
    const dao = res.decodedResult;
    return dao;
  }

  async function getDAOs() {
    console.log({ aeSdk })
    const contract = await aeSdk.initializeContract({ aci: smartdaoACI, address: smartdaoAddress })
    const res = await contract.getDAOs();
    const daos = res.decodedResult;
    return daos;
  }

  async function createProposal(DAOAddress: string, proposal: IProposal) {
    const contract = await aeSdk.initializeContract({ aci: daoACI, address: DAOAddress });
    const res = await contract.createProposal(proposal.proposalType, proposal.description, proposal.value, proposal.target);
  }

  async function voteForProposal(DAOAddress: string, proposalId: number) {
    const contract = await aeSdk.initializeContract({ aci: daoACI, address: DAOAddress });
    const res = await contract.voteFor(proposalId);
  }

  async function voteAgainstProposal(DAOAddress: string, proposalId: number) {
    const contract = await aeSdk.initializeContract({ aci: daoACI, address: DAOAddress });
    const res = await contract.voteAgainst(proposalId);
  }

  async function executeProposal(DAOAddress: string, proposalId: number) {
    const contract = await aeSdk.initializeContract({ aci: daoACI, address: DAOAddress });
    const res = await contract.executeProposal(proposalId);
  }

  async function getProposal(DAOAddress: string, proposalId: number) {
    const contract = await aeSdk.initializeContract({ aci: daoACI, address: DAOAddress })
    const res = await contract.getProposal(proposalId);
    const proposal = res.decodedResult;
    return proposal;
  }

  async function getProposals(DAOAddress: string) {
    const contract = await aeSdk.initializeContract({ aci: daoACI, address: DAOAddress })
    const res = await contract.getProposals();
    const proposals = res.decodedResult;
    return proposals;
  }

  async function getActiveProposals(DAOAddress: string) {
    const contract = await aeSdk.initializeContract({ aci: daoACI, address: DAOAddress })
    const res = await contract.getActiveProposals();
    const proposals = res.decodedResult;
    return proposals;
  }



  const providerValue = useMemo(
    () => ({ isLoggedIn, loginUser, showModal, setShowModal, logoutUser, account, createDAO, getDAOs, aeSdk, getDAO }),
    [isLoggedIn, loginUser, showModal, setShowModal, logoutUser, account, createDAO, getDAOs, aeSdk, getDAO]
  );

  return (
    <UserContext.Provider value={providerValue}>
      {children}
    </UserContext.Provider>
  );
};

export default ContextProvider;
