import '../App.css';

import Select, { SelectChangeEvent } from '@mui/material/Select';

import AddCircleIcon from '@mui/icons-material/AddCircle';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import Container from '@mui/material/Container';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Modal from '@mui/material/Modal';
import ReportIcon from '@mui/icons-material/Report';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { createOrder } from '../services/orders-service';
import { useState } from 'react';

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  maxWidth: '900%',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

interface ICreateOrderModalProps {
  modalOpen: boolean;
  handleCreateOrderClose: () => void;
  handleCreateOrderSuccessfull: () => void;
  handleCreateOrderError: (error: string) => void;
  api: string;
}

export default function CreateOrderModal({
  modalOpen,
  api,
  handleCreateOrderClose,
  handleCreateOrderSuccessfull,
  handleCreateOrderError,
}: ICreateOrderModalProps) {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [storeId, setStoreId] = useState('');

  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStoreChange = (event: SelectChangeEvent) => {
    setStoreId(event.target.value as string);
  };

  const handleCreateOrder = async () => {
    try {
      setIsError(false);
      setLoading(true);

      await createOrder(api, { productId, quantity, storeId });

      // reset the form
      setProductId('');
      setQuantity(0);
      setStoreId('');

      // close modal
      setLoading(false);
      handleCreateOrderSuccessfull();
    } catch (error: any) {
      setIsError(true);
      setLoading(false);
      handleCreateOrderError(error);
    }
  };

  const handleCancelCreateOrder = () => {
    try {
      setIsError(false);
      setLoading(true);

      // reset the form
      setProductId('');
      setQuantity(0);
      setStoreId('');

      // close modal
      setLoading(false);
      handleCreateOrderClose();
    } catch {
      setIsError(true);
      setLoading(false);
    }
  };

  const handleProductChange = (event: SelectChangeEvent) => {
    setProductId(event.target.value as string);
  };

  return (
    <Modal
      data-test="create-order-modal"
      open={modalOpen}
      title="Create Order"
      onClose={handleCreateOrderClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <Container maxWidth="lg">
          <DialogTitle
            id="create-order-dialog-title"
            data-test="create-order-dialog-title"
          >
            <Box display="flex" alignItems="center">
              <Box flexGrow={1}>Order</Box>
              <Box>
                <IconButton
                  data-test="close-modal-button"
                  onClick={handleCreateOrderClose}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>
          </DialogTitle>
          {isError && (
            <Typography
              data-test="error-item"
              className="error-item"
              variant="subtitle1"
              gutterBottom
            >
              <ReportIcon /> sorry, something went wrong..
            </Typography>
          )}
          <Typography
            data-test="create-order-modal-sub-title"
            variant="subtitle1"
            gutterBottom
          >
            Use the form below to create a new order
          </Typography>

          <InputLabel id="product-label">Product</InputLabel>

          <FormControl fullWidth>
            <Select
              labelId="create-order-product-form-control"
              id="create-order-product-form-control"
              data-test="create-order-select-product"
              value={productId}
              label="Product"
              onChange={handleProductChange}
            >
              <MenuItem value={'MacPro'}>Apple Macbook Pro</MenuItem>
              <MenuItem value={'AirPods'}>Apple Airpods</MenuItem>
              <MenuItem value={'MacAir'}>Apple Macbook Air</MenuItem>
            </Select>
          </FormControl>

          <InputLabel id="store-label">Store</InputLabel>

          <FormControl fullWidth>
            <Select
              labelId="create-order-store-form-control"
              id="create-order-store-form-control"
              data-test="create-order-select-store"
              value={storeId}
              label="Store"
              onChange={handleStoreChange}
            >
              <MenuItem value={'59b8a675-9bb7-46c7-955d-2566edfba8ea'}>
                Newcastle
              </MenuItem>
              <MenuItem value={'f5de2a0a-5a1d-4842-b38d-34e0fe420d33'}>
                Manchester
              </MenuItem>
              <MenuItem value={'4e02e8f2-c0fe-493e-b259-1047254ad969'}>
                London
              </MenuItem>
            </Select>
          </FormControl>

          <InputLabel id="quantity-label">Quantity</InputLabel>

          <FormControl fullWidth>
            <TextField
              id="create-order-quantity-form-control"
              data-test="create-order-set-quantity"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              type="number"
              InputLabelProps={{
                shrink: true,
              }}
            />
          </FormControl>

          <Box
            sx={{ marginTop: '20px' }}
            justifyContent="space-between"
            display="flex"
          >
            <Button
              data-test="create-order-modal-button"
              startIcon={<AddCircleIcon />}
              variant="outlined"
              size="small"
              color="primary"
              onClick={handleCreateOrder}
            >
              Create
            </Button>
            <Button
              data-test="cancel-create-order-modal-button"
              startIcon={<CancelIcon />}
              variant="outlined"
              size="small"
              color="secondary"
              onClick={handleCancelCreateOrder}
            >
              Cancel
            </Button>
          </Box>

          <LinearProgress
            data-test="progress-loader"
            style={{ display: loading ? undefined : 'none' }}
            variant="indeterminate"
            color="primary"
          />
        </Container>
      </Box>
    </Modal>
  );
}
