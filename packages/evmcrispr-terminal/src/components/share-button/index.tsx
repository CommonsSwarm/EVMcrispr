import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, useDisclosure, useToast } from '@chakra-ui/react';

import ShareModal from '../share-modal';
import pinJSON from '../../api/pinata/pinJSON';

export default function ShareButton({ script }: { script: string }) {
  const [link, setLink] = useState('');
  const [isUploading, setUploadStatus] = useState(false);
  const {
    isOpen: isShareModalOpen,
    onOpen: onShareModalOpen,
    onClose: onShareModalClose,
  } = useDisclosure({
    id: 'share',
  });

  const params = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  function getRootLocation() {
    const url = window.location.href;
    const urlArr = url.split('/');
    const urlWithoutHash = urlArr.filter((u) => u !== params.hashId);

    return urlWithoutHash.join('/');
  }

  async function handleShare() {
    try {
      setUploadStatus(true);
      onShareModalOpen();

      const data = {
        text: script,
        date: new Date().toISOString(),
      };

      const { IpfsHash } = await pinJSON(data);
      const root = params?.hashId ? getRootLocation() : window.location.href;
      const url = root + '/' + IpfsHash;

      setLink(url);
      setUploadStatus(false);

      return navigate(`/terminal/${IpfsHash}`, { replace: true });
    } catch (e: any) {
      setUploadStatus(false);
      onShareModalClose();
      toast({
        status: 'error',
        title: 'Error while trying to create sharable link',
        description: e.message,
        duration: 9000,
        isClosable: true,
      });
      console.log(e);
    }
  }

  return (
    <>
      <Button onClick={handleShare} variant="blue">
        Share
      </Button>
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={onShareModalClose}
        isLoading={isUploading}
        url={link}
      />
    </>
  );
}
