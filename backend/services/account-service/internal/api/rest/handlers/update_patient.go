package handlers

import (
	"encoding/json"
	"github.com/daariikk/MyHelp/services/account-service/internal/api/response"
	"github.com/daariikk/MyHelp/services/account-service/internal/domain"
	"github.com/daariikk/MyHelp/services/account-service/internal/repository"
	"github.com/pkg/errors"
	"log/slog"
	"net/http"
	"strconv"
)

type UpdatePatientWrapper interface {
	UpdatePatientById(domain.Patient) (domain.Patient, error)
}

func UpdatePatientInfoHandler(logger *slog.Logger, wrapper UpdatePatientWrapper) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		logger.Debug("UpdatePatientInfoHandler starting...")

		patientIDStr := r.URL.Query().Get("patientID")
		patientID, err := strconv.ParseInt(patientIDStr, 10, 64)
		if err != nil {
			logger.Debug("invalid patientID", "error", err)
			response.SendFailureResponse(w, "Invalid patientID", http.StatusBadRequest)
			return
		}
		logger.Debug("Handling UPDATE patient request for patient", "patientID", patientID)

		var patient domain.Patient
		err = json.NewDecoder(r.Body).Decode(&patient)
		if err != nil {
			response.SendFailureResponse(w, "Invalid request data", http.StatusBadRequest)
			return
		}

		patient.Id = int(patientID)
		updatedPatient, err := wrapper.UpdatePatientById(patient)

		logger.Debug("updatedPatient", "updatedPatient", updatedPatient)
		if err != nil {
			if errors.Is(err, repository.ErrorEmailUnique) {
				logger.Debug("Email does not unique")
				response.SendFailureResponse(w, "Email already exists", http.StatusBadRequest)
				return
			} else {
				response.SendFailureResponse(w, "Error updating patient: "+err.Error(), http.StatusInternalServerError)
				return
			}
		}

		logger.Info("UpdatePatientInfoHandler works successful")
		response.SendSuccessResponse(w, updatedPatient, http.StatusOK)
	}
}
