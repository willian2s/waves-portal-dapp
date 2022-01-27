import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import WavePortal from "./utils/WavePortal.json";
import {
  Box,
  Button,
  Flex,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
  useDisclosure,
} from "@chakra-ui/react";
import { formatDate } from "./utils/format";

function App() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentAccount, setCurrentAccount] = useState("");
  const [totalWaves, setTotalWaves] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [allWaves, setAllWaves] = useState([]);

  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
  const contractABI = WavePortal.abi;
  const { ethereum } = window;

  const getAllWaves = async () => {
    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        const waves = await wavePortalContract.getAllWaves();

        const wavesCleaned = waves.map((wave) => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          };
        });

        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletConnected = async () => {
    try {
      if (!ethereum) {
        console.log("Make sure you have metamask!");
      } else {
        console.log("We have the ethereum object!", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log(`Found authorized account: ${account}`);
        getAllWaves();
        setCurrentAccount(account);
      } else {
        console.log("Not found authorized account");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    try {
      if (!ethereum) {
        onOpen(true);
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const getTotalWaves = async () => {
    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const count = await wavePortalContract.getTotalWaves();
        setTotalWaves(count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const wave = async () => {
    setLoading(true);
    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const waveTxn = await wavePortalContract.wave(message, {
          gasLimit: 300000,
        });
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        getTotalWaves();
        setLoading(false);
        setMessage("");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);

  useEffect(() => {
    checkIfWalletConnected();
    getTotalWaves();
  }, []);

  return (
    <>
      <Flex justifyContent="center" marginTop="2rem" width="100vw" padding="8">
        <Flex flexDir="column" justifyContent="center" maxWidth="600px">
          <Box textAlign="center" fontSize="2rem" fontWeight="600">
            <Text>👋 Hey there!</Text>
            <Text>Total Waves: {totalWaves}</Text>
          </Box>
          <Box color="gray" textAlign="center" marginTop="1rem">
            <Text>
              I'm William and I work in web development, and this is my first{" "}
              Web3 project, so this is really cool, right? Connect your Ethereum
              wallet and wave to me!
            </Text>
          </Box>

          {currentAccount && (
            <>
              <Textarea
                placeholder="Type your message..."
                borderColor="gray"
                resize="none"
                height="6.25rem"
                padding="0.5rem"
                marginTop="1rem"
                disabled={loading}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button
                cursor="pointer"
                marginTop="1rem"
                padding="0.5rem"
                border="0"
                borderRadius="5"
                isLoading={loading}
                loadingText="Send wave..."
                onClick={wave}
              >
                Wave at me
              </Button>
            </>
          )}

          {!currentAccount && (
            <Button
              cursor="pointer"
              marginTop="1rem"
              padding="0.5rem"
              border="0"
              borderRadius="5"
              onClick={connectWallet}
            >
              Connect wallet
            </Button>
          )}

          {allWaves &&
            allWaves.map((wave, index) => (
              <Box
                key={index}
                marginTop="1rem"
                backgroundColor="gray.100"
                borderRadius="5px"
                padding="0.5rem"
              >
                <Flex justifyContent="space-between">
                  <Text fontWeight="600">{wave.message}</Text>
                  <Text fontSize="small" color="gray">
                    {formatDate(wave.timestamp)}
                  </Text>
                </Flex>
                <Text fontSize="x-small" color="gray">
                  {wave.address}
                </Text>
              </Box>
            ))}
        </Flex>
      </Flex>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>No Metamask intalled!</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Get Metamask on:{" "}
              <Link href="https://metamask.io/">https://metamask.io/</Link>
            </Text>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default App;
