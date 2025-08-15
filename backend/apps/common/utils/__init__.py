"""
Utils package for common functionality.
"""

from rest_framework.response import Response
from rest_framework import status

def get_client_ip(request):
    """
    Get the client IP address from request.
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def create_success_response(data=None, message="Success", status_code=status.HTTP_200_OK):
    """
    Create a standardized success response.
    """
    response_data = {
        'success': True,
        'message': message
    }
    if data is not None:
        response_data['data'] = data
    
    return Response(response_data, status=status_code)

def create_error_response(message="Error", errors=None, status_code=status.HTTP_400_BAD_REQUEST):
    """
    Create a standardized error response.
    """
    response_data = {
        'success': False,
        'message': message
    }
    if errors is not None:
        response_data['errors'] = errors
    
    return Response(response_data, status=status_code)